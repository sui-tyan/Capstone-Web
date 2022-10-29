require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, __dirname+ '/uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage})
//storage

const app = express();

app.set("view engine", "ejs");
app.use("/public", express.static("public"));
app.use("/uploads", express.static(__dirname + "/uploads"));
app.use("/js", express.static(__dirname + "/js"));
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));

app.use(session({
    secret: "putThisOnENVFileLater",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/PintasDB");

const postSchema = new mongoose.Schema({
    username: String,
    postAuthor: String,
    post_text: String,
    imageContent: String,
    resizedImageContent: String,
    likedBy: [String],
    like_count: Number,
    comment_count: Number
});

const userSchema = new mongoose.Schema({
    email: String,
    name: String,
    password: String,
    posts: [{postSchema}],
    profile_message: String,
    commission_details: String,
    likedPosts: [String]
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);
const Post = new mongoose.model("Post", postSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.route("/login")
.get(function(req, res){
    res.render("login");
})
.post(function(req, res){
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });
    req.login(user, function(err){
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function(){
                res.redirect("/");
            });
        }
    });
});

app.route("/signup")
.get(function(req, res){
    res.render("signup");
})
.post(function(req, res){
    User.register({username: req.body.username}, req.body.password, function(err, user){
        if (err) {
            console.log(err);
            res.redirect("/signup");
        } else {
            User.updateOne({username: req.body.username}, {name: req.body.name}, function(err){
                if(err) {
                    console.log(err);
                } 
            });
            passport.authenticate("local")(req, res, function(){
                res.redirect("/");
            });
        }
    });
});

app.route("/editprofile")
.get(function(req, res){
    if (req.isAuthenticated()) {
        res.render("editprofile", {linkProfile: req.user});
    } else {
        res.redirect("/login");
    }
})
.post(function(req, res){
    console.log(req.user.username);
    console.log(req.body.profile_message);
    console.log(req.body.commission_details);
    if (req.body.profile_message === "") {
        User.updateOne({username: req.user.username}, {commission_details: req.body.commission_details}, function(err) {
            if(err) {
                console.log(err);
            } else {
                console.log("Passed! No Pro Message");
                res.redirect("/profile/" + req.user.username);
            }
        });
    } else if (req.body.commission_details === "" ) {
        User.updateOne({username: req.user.username}, {profile_message: req.body.profile_message}, function(err) {
            if(err) {
                console.log(err);
            } else {
                console.log("Passed! No Comm Details");
                res.redirect("/profile/" + req.user.username);
            }
        });
    } else {
        User.updateOne({username: req.user.username}, {profile_message: req.body.profile_message, commission_details: req.body.commission_details}, function(err) {
            if(err) {
                console.log(err);
            } else {
                console.log("Passed! Both present");
                res.redirect("/profile/" + req.user.username);
            }
        });
    }
});

app.route("/addpost")
.get(function(req, res){
    if (req.isAuthenticated()) {
        res.render("addpost", {linkProfile: req.user});
    } else {
        res.redirect("/login");
    }
})
.post(upload.single('uploaded_file'),function(req, res){

    if (fs.existsSync("uploads/") != true) {
        fs.mkdirSync("uploads/");
    }
    console.log(req.file.destination+req.file.filename);
    sharp(req.file.destination+req.file.filename)
        .resize({width: 600})
        .toFile("uploads/" + "resized-" + req.file.filename);

    console.log(req.file);
    const newPost = new Post({
        username: req.user.username,
        postAuthor: req.user.name,
        post_text: req.body.post_text_content,
        imageContent: req.file.filename,
        resizedImageContent: "resized-" + req.file.filename,
        like_count: 0,
        comment_count: 0
    });
    User.updateOne({username: req.user.username}, {$addToSet: {posts: [{newPost}]}}, function(err){
        if(!err) {
            newPost.save();
        } else {
            console.log(err);
        }
    });
    const userUrl = req.user.username;
    res.redirect("/profile/" + userUrl);
});

app.get("/", function(req, res){
    if(req.isAuthenticated()) {

        Post.find({}, function(err, results){
            res.render("home", {userData: results, linkProfile: req.user});
        });
    } else {
        res.redirect("/login");
    }
});

app.post("/:id", function(req, res){
    if(req.isAuthenticated()){

        console.log("Redirected from like");
        console.log(req.params.id);

        Post.findOneAndUpdate({_id: req.params.id}, {$addToSet: {likedBy: [req.user.id]}}, function(err, results){
            if (err) {
                console.log(err);
            } else {
                User.updateOne({username: req.user.username}, {$addToSet: {likedPosts: [results.id]}}, function(err){
                    if(err){
                        console.log(err);
                    } else {
                        results.like_count += 1;
                        results.save();
                        console.log(results.like_count);
                        res.send({likeCount: results.like_count, likedPosts: results});
                    }
                });
            }
        });

    } else {
        res.redirect("/login");
    }
});

app.get("/gallery", function(req, res){
    if(req.isAuthenticated()) {
        res.render("gallery", {linkProfile: req.user});
    } else {
        res.redirect("/login");
    }
});
app.get("/messages", function(req, res){
    if(req.isAuthenticated()) {
        res.render("messages", {linkProfile: req.user});
    } else {
        res.redirect("/login");
    }
});
app.get("/profile/:userName", function(req, res){
    if(req.isAuthenticated()) {
        User.find({username: req.params.userName}, function(err, foundUser){
            Post.find({username: req.params.userName}, function(err, results){
                if (foundUser[0].username === req.user.username) {
                    res.render("current-profile", {userInfo: foundUser, linkProfile: req.user, userContent: results});
                } else {
                    res.render("profile", {userInfo: foundUser, linkProfile: req.user, userContent: results});
                }
            });
        });
    } else {
        res.redirect("/login");
    }
});

app.get("/logout", function(req, res){
    req.logout(function(err){
        if (err) {
            console.log(err);
        } else {
            res.redirect("/");
        }
    });
});



app.listen(3000, function(){
    console.log("Server is running on port 3000!");
});