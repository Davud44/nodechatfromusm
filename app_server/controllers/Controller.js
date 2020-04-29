var mysql = require('mysql');

var connection = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'node_chat',
    port: '3308'
});

module.exports.index = function (req, res) {
    res.render('index');
}


module.exports.login = function (req, res) {

    res.render('login')
}

module.exports.register = function (req, res) {

    res.render('register');
}
module.exports.register_save = function (req, res) {
    var username = req.query.username;
    var email = req.query.email;
    var password = req.query.password;

    var con_req_check = "select count(*) as say from users where email = '" + email + "' ";
    connection.query(con_req_check, function (err, con_res) {
        if (con_res[0]['say'] == 0) {
            if (username !== '' && typeof username !== 'undefined' && email !== '' && typeof email !== 'undefined') {
                var con_req = "insert into users(id, username , email , password) values('', '" + username + "', '" + email + "' , '" + password + "')";

                connection.query(con_req, function (err, con_res) {
                    if (err === null) {
                        res.redirect('/login')
                    }
                });
            } else {
                res.render('register' , {message : 'fill the blanks correctly'});
            }
        } else {
            res.render('register'  , {message : 'this email already used'});
        }
    })
}
module.exports.login_check = function (req, res) {
    var email = req.query.email;
    var password = req.query.password;
    var check = 0;
    var con_req = "select count(*) as say from users where email = '" + email + "' and password = '" + password + "' ";
    connection.query(con_req, function (err, con_res) {
        if (con_res[0]['say'] == 1) {
            check = 1;
        }
        if (check == 1) {
            res.redirect('/home')
        } else {
            res.render('login' , {message : 'email or password is wrong'})
        }
    })
}
module.exports.home = function (req, res) {
    res.render('home');
}