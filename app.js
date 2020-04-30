var express = require('express');
var app = express();
var path = require('path');
var Router = require('./app_server/routes/Router');
var ejsLayouts = require('express-ejs-layouts');
var session = require('express-session');
var mysql = require('mysql');
var bodyParser = require("body-parser");
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var md5 = require('md5')

app.use('/', Router);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.urlencoded({
    extended: true
}))
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(session({
    'secret': 'nodeders',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 600000000000000
    }
}));


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, './app_server/views'))


var connection = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'node_chat',
    port: '3308'
});

app.get('/', (req, res) => {
    res.render('index');
})
app.get('/login', (req, res) => {
    res.render('login');
})
app.get('/register', (req, res) => {
    res.render('register');
})
app.post('/register_save', (req, res) => {
    var username = req.body.username;
    var email = req.body.email;
    var password = md5(req.body.password);
    console.log(password)
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
                res.render('register', {
                    message: 'fill the blanks correctly'
                });
            }
        } else {
            res.render('register', {
                message: 'this email already used'
            });
        }
    })
})
app.post('/login_check', async function(req,res){
    var email = req.body.email;
    var password = md5(req.body.password);
    var check = 0;
    var con_req = "select * , count(*) as say from users where email = '" + email + "' and password = '" + password + "' ";
    connection.query(con_req, function (err, con_res) {
        if (con_res[0]['say'] == 1) {
            check = 1;
        }
        if (check == 1) {
            req.session.userId = con_res[0]['id'];
            res.redirect('/home')
        } else {
            res.render('login', {
                message: 'email or password is wrong'
            })
        }
    })
})
app.get('/home', (req, res) => {
    if (req.session.userId) {
        var con_req = "select * from users where id = '" + req.session.userId + "' ";
        connection.query(con_req, function (err, con_res) {
            res.render('home', {
                data: req.session.userId
            });
        })
    } else {
        res.redirect('/login');
    }
})
app.get('/logout', (req, res) => {
    delete req.session.userId;
    res.redirect('/login');
})

app.post('/search', (req, res) => {
    var val = req.body.val;
    var idMe = req.session.userId;
    var con_req = "select * from users where email like '%" + val + "%' and id  <> ' " + idMe + " '  limit 5 ";
    connection.query(con_req, function (err, con_res) {
        res.send(con_res)
    })
})
var userId = "";
app.get('/chat', (req, res) => {
    userId = req.session.userId;
    var id = req.query.id
    var con_req = "select * from chat where fromm = '" + userId + "' and too = '" + id + "' or fromm='" + id + "' and too='" + userId + "' ORDER BY time ASC ";
    connection.query(con_req, function (err, con_res) {
        var get_username = "select username , email from users where id = '" + id + "' ";
        connection.query(get_username, function (err2, users) {
            var username = users[0]['username'];
            res.render('chat', {
                userId: userId,
                username: username,
                messages: con_res
            });
        })
    })
})
var users = [];
io.on('connection', (socket) => {
    var arr = [];
    arr.push(userId, socket.id);
    users.push(arr)
    arr = []
    socket.on('chat message', (msg) => {
        to = msg['to'].trim();
        me = msg['me'].trim();
        var acc;
        date = new Date();
        date = date.getUTCFullYear() + '-' +
            ('00' + (date.getUTCMonth() + 1)).slice(-2) + '-' +
            ('00' + date.getUTCDate()).slice(-2) + ' ' +
            ('00' + date.getHours()).slice(-2) + ':' +
            ('00' + date.getUTCMinutes()).slice(-2) + ':' +
            ('00' + date.getUTCSeconds()).slice(-2);
        var con_req = "insert into chat (fromm , too , message , time ) values ( '" + me + "' , '" + to + "' , '" + msg['message'] + "' , '" + date.trim() + "'  )";
        connection.query(con_req, function (err, con_res) {

        })
        users.forEach(function (index, key) {
            if (index[0] == to) {
                acc = index[1];
            }
        });
        io.to(acc).emit('chat message', {
            msg: msg,
            id: me
        });
    });
});

http.listen(process.env.PORT);

// http.listen(8000, '192.168.1.8');
// const hostname = '192.168.1.8';
// port = 8000;
// app.listen(port, hostname);
