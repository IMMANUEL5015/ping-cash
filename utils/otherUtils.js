const randomString = require('random-string');
const User = require('../models/user');
const notification = require('../controllers/notification');
const { failedTransactionsEmail } = require('./email');
const SocketIo = require('./socket');
const Email = require('../models/email');
const cron = require('node-cron');
const AppError = require('./appError');
const catchAsync = require('./catchAsync');
const Expense = require('../models/expense');

exports.generateRef = () => {
    const uniqueString = randomString({ length: 26, numeric: true });
    return uniqueString;
}

const findPrivilegedUsers = async (privilege) => {
    const users = await User.find({}).populate('roles');
    const privilegedUsers = [];
    for (let i = 0; i < users.length; i++) {
        const user = users[i];

        const userRoles = user.roles;

        for (let a = 0; a < userRoles.length; a++) {
            const role = userRoles[a];
            const rolePrivileges = role.privileges;

            for (let b = 0; b < rolePrivileges.length; b++) {
                const rolePrivilege = rolePrivileges[b];

                if (rolePrivilege.name === privilege) {
                    privilegedUsers.push(user);
                }
            }
        }
    }

    return privilegedUsers;
}

exports.notifyPrivilegedUsersOfFailedTransactions = async (obj) => {
    try {
        let io = SocketIo.getSocket();
        const { message, type, transactionId } = obj;
        const privilegedUsers = await findPrivilegedUsers('view-failed-transactions');
        for (let i = 0; i < privilegedUsers.length; i++) {
            const user = privilegedUsers[i];

            await notification.createNotification({
                message,
                user,
                type,
                transactionId
            });

            io.emit('notification', "new notification");

            await Email.create({
                status: 'pending',
                user
            });
        }
    } catch (error) {
        console.error(error);
    }
}

exports.checkIfLoggedInUserHasRequiredPrivilege = (privilege) => {
    return catchAsync(async (req, res, next) => {
        if (req.user.role === 'super-admin') return next();
        if (req.user.role === 'system-admin') return next();

        const users = await findPrivilegedUsers(privilege);

        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            if (user.email === req.user.email) return next();
        }

        return next(new AppError('You do not have the privilege to access this resource.', 403));
    });
}

exports.calcAdministrativeExpenses = async (dollarInNaira, finalAmountReceived) => {
    try {
        let administrativeExpenses = [];
        let actualAdministrativeExpensesInNaira = 0;

        const expenses = await Expense.find({});

        for (let i = 0; i < expenses.length; i++) {
            let obj = {};
            const expense = expenses[i];

            if (expense && expense.flatOrPercentage === 'flat') {
                obj.expense = expense;
                obj.amountInNaira = expense.figure;

                actualAdministrativeExpensesInNaira += obj.amountInNaira;
            }

            if (expense && expense.flatOrPercentage === 'percent') {
                obj.expense = expense;
                const { figure } = expense;

                const expenseCut = (figure / 100) * dollarInNaira;

                obj.amountInNaira = (expenseCut * Number(finalAmountReceived));

                actualAdministrativeExpensesInNaira += obj.amountInNaira;
            }

            administrativeExpenses.push(obj);
        }

        return [administrativeExpenses, actualAdministrativeExpensesInNaira];
    } catch (error) {
        console.error(error);
    }
}

cron.schedule('*/15 * * * * *', async () => {
    try {
        const email = await Email.findOne({ status: 'pending' }).populate('user');
        if (email) {
            await failedTransactionsEmail(email.user);
            await Email.findByIdAndUpdate(email.id, { status: 'sent' }, { new: true });
        }
    } catch (error) {
        console.error(error);
    }
});