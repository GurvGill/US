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
	phone: String,
	bio: String,
	birthday: String,
	picture: Buffer,
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

var Comment = mongoose.model('comments', new Schema({
	id: ObjectId,
	email: String,
	user: String,
	job: String,
	comment: String,
	announcement_id: String,
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
	if(req.session && req.session.user){
		User.findOne( { email: req.session.user.email }, function(err, user){
		if(!user){
			req.session.reset();
			res.redirect("/login");
		} else {
			res.locals.user = user;
			res.render('index');
			error = '';
		}
	});
	} else{
		res.locals.user = null;
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
		phone: "",
		bio: "",
		birthday: "",
		picture: "./public/images/6.jpg",
	});
	user.save(function(err) {
		if(err){
			if(err.code == 11000)
			{
				res.locals.error = 'That email is taken, please try another email.';
				res.render('register');
			}
		}
		else{
			User.findOne( {email: req.body.email} , function(err, user) {
    			if(!user){
    				res.locals.error = 'Invalid email or password';
    				res.render('login');
    			}else{
    				if(req.body.password == user.password){
    					req.session.user = user;
    					res.redirect("/profile");
    				} else{
    					res.locals.error = 'Invalid email or password';
    					res.render('login');
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
    		res.locals.error =  'No account associated with that email';
    		res.render('login');
    	}else{
    		if(req.body.password == user.password){
    			req.session.user = user;
    			Announcement.count(function(err, count)
				{
					if(err){}
					global.c = count;
				});
				Announcement.find(function(err, announcement)
				{
					if(err){}
					global.a = announcement;
				});
				res.locals.user = user;
				res.locals.count = global.c;
				res.locals.announcement = global.a;
    			res.render("profile");
    		} else{
    			res.locals.error = 'Incorrect password';
    			res.render('login');
    		}
    	}
    });
});

app.get('/profile', function(req,res) {
	res.locals.error = error;
	if(req.session && req.session.user){
		User.findOne( { email: req.session.user.email }, function(err, user){
			if(!user){
				req.session.reset();
				res.redirect("/login");
			} else {
				Announcement.count(function(err, count)
				{
					if(err){}
					global.c = count;
				});
				Announcement.find(function(err, announcement)
				{
					if(err){}
					global.a = announcement;
				});
				res.locals.user = user;
				res.locals.count = global.c;
				res.locals.announcement = global.a;
				res.render("profile");
			}
		});
	} else {
		error = "You must Sign In to view your Profile.";
		res.redirect("/login");
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
	if(req.session && req.session.user){
		User.findOne( { email: req.session.user.email }, function(err, user){
		if(!user){
			req.session.reset();
			res.locals.error = "Please Sign in to edit profile.";
			res.redirect("/login");
		} else {
			Announcement.count(function(err, count)
			{
				if(err){}
				global.c = count;
			});
			Announcement.find(function(err, announcement)
			{
				if(err){}
				global.a = announcement;
			});
			res.locals.user = user;
			res.locals.count = global.c;
			res.locals.announcement = global.a;
			res.render('edit_profile');
			res.locals.error = '';
		}
	});
	} else{
		res.locals.user = null;
		error = "Please Sign in to edit profile.";
		res.render('/login');
	}
});

app.get('/password', function(req, res){
	res.locals.error = error;
	if(req.session && req.session.user){
		User.findOne( { email: req.session.user.email }, function(err, user){
		if(!user){
			req.session.reset();
			res.locals.error = "Please Sign in to change password.";
			res.redirect("/login");
		} else {
			Announcement.count(function(err, count)
			{
				if(err){}
				global.c = count;
			});
			Announcement.find(function(err, announcement)
			{
				if(err){}
				global.a = announcement;
			});
			res.locals.user = user;
			res.locals.count = global.c;
			res.locals.announcement = global.a;
			res.render('password');
			res.locals.error = '';
		}
	});
	} else{
		res.locals.user = null;
		error = "Please Sign in to change password.";
		res.render('/login');
	}
});

app.get('/announcement', function(req,res){
	res.locals.error = error;
	if(req.session && req.session.user){
		User.findOne( { email: req.session.user.email }, function(err, user){
		if(!user){
			req.session.reset();
			res.locals.error = "Please Sign in to Post an announcement";
			res.redirect("/login");
		} else {
			res.locals.user = user;
			res.render("announcement");
			res.locals.error = '';
		}
	});
	} else{
		res.locals.user = null;
		error = "Please Sign in to Post an announcement";
		res.render('/login');
	}
});

app.post('/announcement', function(req,res){
	res.locals.error = error;
	if(req.session && req.session.user){
		User.findOne( { email: req.session.user.email }, function(err, user){
		if(!user){
			req.session.reset();
			res.locals.error = "Please Sign in to Post an announcement";
			res.redirect("/login");
		} else {
			res.locals.user = user;
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
					Announcement.count(function(err, count)
					{
						if(err){}
						global.c = count;
					});
					Announcement.find(function(err, announcement)
					{
						if(err){}
						global.a = announcement;
					});
					
					res.locals.user = user;
					res.locals.count = global.c;
					res.locals.announcement = global.a;
					res.redirect("/stream");
					res.locals.error = '';
				}
			});	
		}
	});
	} else{
		res.locals.user = null;
		error = "Please Sign in to Post an announcement";
		res.render('announcement');
	}
});

app.get('/stream', function(req,res){
	res.locals.error = error;
	if(req.session && req.session.user){
		User.findOne( { email: req.session.user.email }, function(err, user){
			if(!user){
				req.session.reset();
				res.locals.error = "Please Sign in. Stream is private access for Users only";
				res.redirect("/login");
			} else {
				Announcement.count(function(err, count)
				{
					if(err){}
					global.c = count;
				});
				Announcement.find(function(err, announcement)
				{
					if(err){}
					global.a = announcement;
				});
				Comment.count(function(err, count){
					if(err){}
					global.num = count;
				});
				Comment.find(function(err,comment){
					if(err){}
					global.com = comment;
				});

				res.locals.user = user;
				res.locals.announcement = global.a;
				res.locals.count = global.c;
				res.locals.com = global.com;
				res.locals.num = global.num;
				res.render("stream");
				res.locals.error = '';
			}
		});
	} else{
		res.locals.user = null;
		error = "Please Sign in. Stream is private access for Users only.";
		res.redirect("/login");
	}
}); 

app.post('/comment', function(req,res){
	res.locals.error = error;
	if(req.session && req.session.user){
		User.findOne( { email: req.session.user.email }, function(err, user){
			if(!user){
				req.session.reset();
				res.locals.error = "Please Sign in to comment on an announcement";
				res.redirect("/login");
			} else {
				res.locals.user = user;
				var com = new Comment({
					email: user.email,
					user: user.username,
					job: user.job,
					comment: req.body.mess,
					announcement_id: req.body.id,
					date: new Date,
				});
				com.save(function(err) {
					if(err)
					{
						res.locals.error = "Try again!";
						res.render("stream");
					} else {
						Announcement.update({_id: req.body.id}, {$set: {comment:"yes"}}, function(err, comment){
							if(err){}
						});
						Announcement.count(function(err, count)
						{
							if(err){}
							global.c = count;
						});
						Announcement.find(function(err, announcement)
						{
							if(err){}
							global.a = announcement;
						});
						Comment.count(function(err, count){
							if(err)
							global.num = count;
						});
						Comment.find(function(err,comment){
							if(err){}
							global.com = comment;
						});

						res.locals.user = user;
						res.locals.announcement = global.a;
						res.locals.count = global.c;
						res.locals.com = global.com;
						res.locals.num = global.num;
						res.render("stream");
						res.locals.error = '';
					}
				});			
			}
		});
	} else{
		res.locals.user = null;
		error = "Please Sign in to comment on an announcement";
		res.redirect('stream');
	}
});
app.listen(3000);