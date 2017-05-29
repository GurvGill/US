var bodyParser = require('body-parser');
var path = require('path');
var express = require('express');
var mongoose = require('mongoose');
var session = require('client-sessions');
var multer = require('multer');
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, req.session.user.email);
  }
})

var upload = multer({ storage: storage });

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
	picture: String,
}));

var Announcement = mongoose.model('announcements', new Schema({
	id: ObjectId,
	announcement: String,
	email: String,
	user: String,
	company: String,
	job: String,
	tag: String,
	picture: String,
	comment: Boolean,
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

var Message = mongoose.model('messages', new Schema({
	email: String,
	user: String,
	job: String,
	company: String,
	message: String,
	picture: String,
	date: Date,
}));

var Chat = mongoose.model('chats', new Schema({
	email: String,
	user: String,
	job: String,
	company: String,
	message: String,
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

app.all ('*', function (req,res,next) {
	if(req.session && req.session.user){
		User.findOne( { email: req.session.user.email }, function(err, user){
			if(!user){
				req.session.reset();
				error = "Sign in."
				res.redirect("/login");
			} else {
				res.locals.user = user;
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
				Message.count(function(err, count){
					if(err){}
					global.numb = count;
				});
				Message.find(function(err,comment){
					if(err){}
					global.mess = comment;
				});
				User.find({company: {$in: user.company}}, function(err, contacts){
					if(err) {}
					global.contacts = contacts;
				});
				User.count({company: {$in: user.company}}, function(err, contacts){
					if(err) {}
					global.contacts_count = contacts;
				});
				res.locals.contacts_count = global.contacts_count;
				res.locals.contacts = global.contacts;
				res.locals.announcement = global.a;
				res.locals.count = global.c;
				res.locals.com = global.com;
				res.locals.num = global.num;
				res.locals.counter = global.numb;
				res.locals.message = global.mess;
			    next();
			}
		});
	} else {
		next();
	}
});

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
		phone: "(xxx)-xxx-xxxx",
		bio: "No Bio",
		birthday: "xx/xx/xxxx",
		picture: "image.jpg",
	});
	if(req.body.password!=req.body.confirm_password)
	{
		error = "Password field and Confirm password field do not match.";
		res.redirect('/register');
	}else{
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
    				error = 'Invalid email or password';
    				res.redirect('/login');
    			}else{
    				if(req.body.password == user.password){
    					req.session.user = user;
    					res.locals.user = user;
    					res.redirect("/edit_profile");
    				} else{
    					error = 'Invalid email or password';
    					res.redirect('/login');
    				}	
    			}
    		});
		}
	});
	}
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
    		error = 'No account associated with that email';
    		res.redirect('/login');
    	}else{
    		if(req.body.password == user.password){
    			req.session.user = user;
    			res.redirect("/profile");
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
				error = "Sign in to view your profile."
				res.redirect("/login");
			} else {
				res.locals.user = user;
				User.find({company: {$in: user.company}}, function(err, contacts){
					if(err) {}
					global.contacts = contacts;
				});
				User.count({company: {$in: user.company}}, function(err, contacts){
					if(err) {}
					global.contacts_count = contacts;
				});
				res.locals.contacts_count = global.contacts_count;
				res.locals.contacts = global.contacts;
				res.render("profile");
				error = '';
			}
		});
	} else {
		error = "You must Sign In to view your Profile.";
		res.redirect("/login");
	}
});

app.get('/contacts', function(req,res){
	res.locals.error = error;
	if(req.session && req.session.user){
		User.findOne( { email: req.session.user.email }, function(err, user){
			if(!user){
				req.session.reset();
				error = "Sign in to view your Contacts."
				res.redirect("/login");
			} else {
				res.locals.user = user;
				User.find({company: {$in: user.company}}, function(err, contacts){
					if(err) {}
					global.contacts = contacts;
				});
				User.count({company: {$in: user.company}}, function(err, contacts){
					if(err) {}
					global.contacts_count = contacts;
				});
				res.locals.contacts_count = global.contacts_count;
				res.locals.contacts = global.contacts;
				res.render("contacts");
				error = '';
			}
		});
	} else {
		error = "You must Sign In to view your Contacts.";
		res.redirect("/login");
	}
});

app.get('/get_profile', function(req,res) {
	res.locals.error = error;
	User.findOne( { email: req.query.email }, function(err, user){
		if(!user){
			error = "User does not exist anymore.";
			res.redirect("/stream");
		} else {
			res.locals.user = user;
			res.render("profile");
			error = '';
		}
	}); 
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
			error = "Please Sign in to edit profile.";
			res.redirect("/login");
		} else {
			res.locals.user = user;
			res.render('edit_profile');
			error = '';
		}
	});
	} else{
		res.locals.user = null;
		error = "Please Sign in to edit profile.";
		res.redirect('/login');
	}
});
app.post('/edit_profile', upload.any(), function(req,res){
	res.locals.error = error;
	if(req.session && req.session.user){
		User.findOne( { email: req.session.user.email }, function(err, user){
		if(!user){
			req.session.reset();
			error = "Please Sign in to edit profile.";
			res.redirect("/login");
		} else {
			User.update({_id: user._id},{$set: {bio: req.body.bio, username: req.body.username, company: req.body.company, email: req.body.email, phone: req.body.phone, birthday: req.body.birthday, picture: req.body.email}}, function(err, bio){
				if(err){}
			});
			res.redirect('/profile');
		}
	});
	} else{
		res.locals.user = null;
		error = "Please Sign in to edit profile.";
		res.redirect('/login');
	}
});

app.get('/password', function(req, res){
	res.locals.error = error;
	if(req.session && req.session.user){
		User.findOne( { email: req.session.user.email }, function(err, user){
		if(!user){
			req.session.reset();
			error = "Please Sign in to change password.";
			res.redirect("/login");
		} else {
			res.locals.user = user;
			res.render('password');
			error = '';
		}
	});
	} else{
		res.locals.user = null;
		error = "Please Sign in to change password.";
		res.redirect('/login');
	}
});

app.get('/announcement', function(req,res){
	res.locals.error = error;
	if(req.session && req.session.user){
		User.findOne( { email: req.session.user.email }, function(err, user){
		if(!user){
			req.session.reset();
			error = "Please Sign in to Post an announcement";
			res.redirect("/login");
		} else {
			res.locals.user = user;
			res.render("announcement");
			error = '';
		}
	});
	} else{
		res.locals.user = null;
		error = "Please Sign in to Post an announcement";
		res.redirect('/login');
	}
});

app.post('/announcement', function(req,res){
	res.locals.error = error;
	if(req.session && req.session.user){
		User.findOne( { email: req.session.user.email }, function(err, user){
		if(!user){
			req.session.reset();
			error = "Please Sign in to Post an announcement";
			res.redirect("/login");
		} else {
			res.locals.user = user;
			var announcement = new Announcement({
				announcement: req.body.announcement,
				user: user.username,
				email: user.email,
				company: user.company,
				job: user.job,
				tag: req.body.tag,
				picture: user.picture,
				comment: false,
				date: new Date,
			});
			announcement.save(function(err) {
				if(err)
				{
					res.locals.error = "Try again!";
					res.render("announcement");
				} else {
					res.redirect("/stream");
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
				error = "Please Sign in. Stream is private access for Users only";
				res.redirect("/login");
			} else {
				res.locals.user = user;
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
				error = '';
			}
		});
	} else{
		res.locals.user = null;
		error = "Please Sign in. Stream is private access for Users only.";
		res.redirect("/login");
	}
}); 

app.get('/comment', function(req,res){
	res.locals.error = error;
	if(req.session && req.session.user){
		User.findOne( { email: req.session.user.email }, function(err, user){
		if(!user){
			req.session.reset();
			error = "Please Sign in to comment";
			res.redirect("/login");
		} else {
				res.redirect("/stream");
		}
	});
	} else{
		res.locals.user = null;
		error = "Please Sign in to to comment";
		res.redirect('/login');
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
					company: user.company,
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
						Announcement.update({_id: req.body.id}, {$set: {comment:true}}, function(err, comment){
							if(err){}
						});
						
					}
				});	
				res.redirect("/comment");	
			}
		});
	} else{
		res.locals.user = null;
		error = "Please Sign in to comment on an announcement";
		res.redirect('/stream');
	}
});

app.get('/change_password', function(err,res){
	res.locals.error = error;
	if(req.session && req.session.user){
		User.findOne( { email: req.session.user.email }, function(err, user){
		if(!user){
			req.session.reset();
			res.redirect("/login");
		} else {
			res.locals.user = user;
			res.render('password');
			error = '';
		}
	});
	} else{
		res.locals.user = null;
		res.redirect('/index');
	}
});

app.post('/change_password', function(req,res){
	res.locals.error = error;
	if(req.session && req.session.user){
		User.findOne( { email: req.session.user.email }, function(err, user){
		if(!user){
			req.session.reset();
			error = "Please Sign in";
			res.redirect("/login");
		} else {
			res.locals.user = user;
			if(req.body.current_pass != user.password){
				res.locals.error = "Current Password is not correct."
				res.render("password");
			}
			if(req.body.pass != req.body.con_pass){
				res.locals.error = "Password field and Confirm Password field do not match."
				res.render("password");
			}
			User.update({_id: user._id}, {$set: {password: req.body.pass}},function(err,argument) {
				if(err){}
				
				res.locals.error = "Password changed."
				res.render("password");
			});
		}
	});
	} else{
		res.locals.user = null;
		error = "Please Sign in";
		res.redirect('/login');
	}
});

app.get('/company_stream', function(req,res){
	res.locals.error = error;
	if(req.session && req.session.user){
		User.findOne( { email: req.session.user.email }, function(err, user){
			if(!user){
				req.session.reset();
				error = "Please Sign in. Company Stream is private access for Users only";
				res.redirect("/login");
			} else {
				res.locals.user = user;
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
				res.render("company_stream");
			}
		});
	} else{
		res.locals.user = null;
		error = "Please Sign in. Company Stream is private access for Users only.";
		res.redirect("/login");
	}
});

app.get('/company_chat', function(req,res){
	res.locals.error = error;
	if(req.session && req.session.user){
		User.findOne( { email: req.session.user.email }, function(err, user){
			if(!user){
				req.session.reset();
				error = "Please Sign in. Company Chat is private access for Users only";
				res.redirect("/login");
			} else {
				res.redirect("/company_chat2");
			}
		});
	} else{
		res.locals.user = null;
		error = "Please Sign in. Company Chat is private access for Users only.";
		res.redirect("/login");
	}
});
app.get('/company_chat2', function(req,res){
	res.locals.error = error;
	if(req.session && req.session.user){
		User.findOne( { email: req.session.user.email }, function(err, user){
			if(!user){
				req.session.reset();
				error = "Please Sign in. Company Chat is private access for Users only";
				res.redirect("/login");
			} else {	
				res.locals.user = user;
				res.render("company_chat");
				res.locals.error = '';
			}
		});
	} else{
		res.locals.user = null;
		error = "Please Sign in. Company Chat is private access for Users only.";
		res.redirect("/login");
	}
});

app.post('/add_message', function(req,res){
	res.locals.error = error;
	if(req.session && req.session.user){
		User.findOne( { email: req.session.user.email }, function(err, user){
			if(!user){
				req.session.reset();
				error = "Please Sign in. Company Chat is private access for Users only";
				res.redirect("/login");
			} else {
				var message = new Message({
					email: user.email,
					user: user.username,
					job: user.job,
					company: user.company,
					message: req.body.message,
					picture: user.picture,
					date: new Date,
				});
				message.save(function(err) {
					if(err)
					{
						res.locals.error = "Try again!";
						res.render("company_chat");
					} else {}
				});		
			}
			res.redirect("/company_chat");
		});
	} else{
		res.locals.user = null;
		error = "Please Sign in. Company Chat is private access for Users only.";
		res.redirect("/login");
	}
});

app.get('/add_event', function(req,res){
	res.locals.error = error;
	if(req.session && req.session.user){
		User.findOne( { email: req.session.user.email }, function(err, user){
		if(!user){
			req.session.reset();
			error = "Please sign in.";
			res.redirect("/login");
		} else {
			res.locals.user = user;
			res.render("event");
			error = '';
		}
	});
	} else{
		res.locals.user = null;
		error = "Please sign in to view your events";
		res.redirect('/login');
	}
});

app.get('/events', function(req,res){
	res.locals.error = error;
	if(req.session && req.session.user){
		User.findOne( { email: req.session.user.email }, function(err, user){
		if(!user){
			req.session.reset();
			error = "Please sign in.";
			res.redirect("/login");
		} else {
			res.locals.user = user;
			res.render("events");
			error = '';
		}
	});
	} else{
		res.locals.user = null;
		error = "Please sign in to view your events";
		res.redirect('/login');
	}
});


app.get('/calendar', function(req,res){
	res.locals.error = error;
	if(req.session && req.session.user){
		User.findOne( { email: req.session.user.email }, function(err, user){
		if(!user){
			req.session.reset();
			error = "Please sign in.";
			res.redirect("/login");
		} else {
			res.locals.user = user;
			res.render("calendar");
			error = '';
		}
	});
	} else{
		res.locals.user = null;
		error = "Please sign in to view your Calendar";
		res.redirect('/login');
	}
});

app.get("/calendar2", function(req,res){
	res.locals.error = error;
	if(req.session && req.session.user){
		User.findOne( { email: req.session.user.email }, function(err, user){
		if(!user){
			req.session.reset();
			error = "Please sign in.";
			res.redirect("/login");
		} else {
			res.locals.user = user;
			res.render("calendar2");
			error = '';
		}
	});
	} else{
		res.locals.user = null;
		error = "Please sign in to view your Calendar";
		res.redirect('/login');
	}
});

var io = require('socket.io').listen(app.listen((process.env.PORT || 5000));

io.on('connection', function (socket) {
    socket.emit('message', { message: 'welcome to the chat' });
    socket.on('chat message', function (msg) {
       	io.emit('chat message', msg);
  
	});
});