require('dotenv').config();
const PORT = process.env.PORT;
const app = require('./app');

//Setup server
app.listen(PORT, () => {
    console.log(`Sever has started and is listening on port ${PORT}`);
});