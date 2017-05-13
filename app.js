var bodyParser = require('body-parser');
var path = require('path');
var express = require('express');
var mongoose = require('mongoose');
var session = require('client-sessions');

var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var error = '';

var User = mongoose.model('User', new Schema({
	id: ObjectId,
	company: String,
	job: String,
	username: {type: String, unique: true},
	email: {type: String, unique: true},
	password: String,
}));

var Announcement = mongoose.model('announcements', new Schema({
	id: ObjectId,
	announcement: String,
	email: String,
	user: String,
	job: String,
	tag: String,
	comment: String,
	date: Date,
}));

var app = express();
app.set('view engine', 'ejs');
app.locals.pretty = true;

// connect to mongo
mongoose.connect('mongodb://Gurvir:hello1@ds062889.mlab.com:62889/usdb');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', function callback () {
        console.log('Connected To Mongo Database');
    });

//middleware
app.use(bodyParser.urlencoded({ extended: true}));
app.use(express.static(path.join(__dirname, 'public')));


app.use(session({
	cookieName: 'session',
	secret: 'asdfghjkl1234567890',
	duration: 30 * 60 * 1000,
	activeDuration: 5 * 60 * 1000,
}));

app.get('/', function (req, res) {
	res.locals.error = error;
	user = UserLoggedIn(req,res);
	if(user == null){
		res.locals.user = null;
		res.render('index');
		error = '';
	} else{
		res.locals.user = user;
		res.render('index');
		error = '';
	}
});

app.get('/register', function(req,res) {
	res.locals.error = error;
	res.render('register');
	error = '';
});

app.post('/register', function(req,res) {
	res.locals.error = error;
	var user = new User({
		company: req.body.company,
		job: req.body.job,
		username: req.body.username,
		email: req.body.email,
		password: req.body.password,
	});
	user.save(function(err) {
		if(err){
			if(err.code == 11000)
			{
				error = 'That email is taken, please try another email.';
				res.render('register');
				error = '';
			}
		}
		else{
			User.findOne( {email: req.body.email} , function(err, user) {
    			if(!user){
    				error = 'Invalid email or password';
    				res.render('login');
    				error = '';
    			}else{
    				if(req.body.password == user.password){
    					req.session.user = user;
    					res.redirect("/profile");
    				} else{
    					error = 'Invalid email or password';
    					res.render('login');
    					error = '';
    				}	 
    			}
    		});
		}
	})
});

app.get('/login', function(req,res) {
	res.locals.error = error;
	res.render('login');
	error = '';
});

app.post('/login', function(req,res) {
	res.locals.error = error;
	User.findOne( {email: req.body.email} , function(err, user) {
    	if(!user){
    		res.locals.error = 'Invalid email or password';
    		res.render('login');
    	}else{
    		if(req.body.password == user.password){
    			req.session.user = user;
    			res.locals.user = user;
    			res.locals.count = countAnnouncements();
				res.locals.announcement = getAnnouncements();
    			res.render("profile");
    		} else{
    			error = 'Invalid email or password';
    			res.render('login');
    		}
    	}
    });
});

app.get('/profile', function(req,res) {
	res.locals.error = error;
	user = UserLoggedIn(req,res);
	if(user == null){
		res.locals.user = null;
		error = "You must Sign In to view your Profile.";
		res.redirect("/login");
	} else{
		res.locals.user = user;
		res.locals.count = countAnnouncements();
		res.locals.announcement = getAnnouncements();
		res.render("profile");
	}
});

app.get('/logout', function(req, res) {
	res.locals.error = error;
	req.session.reset();
	error = 'You have sucessfully logged out!';
	res.redirect("/");
});

app.get('/edit_profile', function(req,res){
	res.locals.error = error;
	res.render('edit_profile');
	error = '';
});

app.get('/change_picture', function(req, res){
	res.locals.error = error;
	res.render('change_picture');
	error = '';
});

app.get('/announcement', function(req,res){
	res.locals.error = error;
	user = UserLoggedIn(req,res);
	if(user == null){
		res.locals.user = null;
		error = "Please Sign in to Post an announcement";
		res.render('/login');
	} else{
		res.locals.user = user;
		res.render("announcement");
		error = '';
	}
});

app.post('/announcement', function(req,res){
	res.locals.error = error;
	user = UserLoggedIn(req,res);
	if(user == null){
		res.locals.user = null;
		error = "Please Sign in to Post an announcement";
		res.redirect("/login");
	} else{
		var announcement = new Announcement({
			announcement: req.body.announcement,
			user: user.username,
			email: user.email,
			job: user.job,
			tag: req.body.tag,
			comment: "",
			date: new Date,
		});
		announcement.save(function(err) {
			if(err)
			{
				res.locals.error = "Try again!";
				res.render("announcement");
			} else {
				res.render("stream");
				res.locals.error = '';
			}
		});	
	}
});

app.get('/stream', function(req,res){
	res.locals.error = error;
	user = UserLoggedIn(req,res);
	if(user == null){
		res.locals.user = null;
		error = "Please Sign in. Stream is private access for Users only.";
		res.redirect("/login");
	} else{
		res.locals.user = user;
		res.locals.count = countAnnouncements();
		res.locals.announcement = getAnnouncements();
		res.render("stream");
		error = '';
	}
});

app.post('/comment', function(req,res){
	res.locals.error = error;
	if(user == null){
		res.locals.user = null;
		error = "Please Sign in to comment on an announcement";
		res.redirect('stream');
	} else{
		res.locals.user = user;
		res.locals.count = countAnnouncements();
		res.locals.announcement = getAnnouncements();
		res.render("stream");
	}
});

function UserLoggedIn(req,res){
	if(req.session && req.session.user){
		User.findOne( { email: req.session.user.email }, function(err, user){
		if(!user){
			req.session.reset();
			global.u = null;
		} else {
			global.u = user;
		}
	});
	} else{
		global.u = null;
	}
	return global.u;
}

function countAnnouncements(){
	Announcement.count(function(err, count)
	{
		if(err){}
		global.count = count;
	});
	return global.count;
}

function getAnnouncements(){
	Announcement.find(function(err, announcement)
	{
		if(err){}
		global.announcement = announcement;
	});
	return global.announcement;
}


app.listen(3000);