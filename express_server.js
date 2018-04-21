
// DEPENDENCIES

var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080
var bcrypt = require('bcrypt');
var cookieSession = require('cookie-session');

app.use(cookieSession({name: 'session',
  keys: ['dfgdgsdg'],
  maxAge: 24 * 60 * 60 * 1000
}));

var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

// This function generates a random string that is assigned to the user ID or the shortened urls.

function generateRandomString() {
 let id = Math.floor((1 + Math.random()) * 0x1000000).toString(16).substring(1);
 return id
}

app.set("view engine", "ejs");

// USER DATABASE OBJECT

const users = {

  //Example of data structure

  // "userRandomID": {
  //   id: "userRandomID",
  //   email: "user@example.com",
  //   password: "purple-monkey-dinosaur"
  // },
  // "user2RandomID": {
  //   id: "user2RandomID",
  //   email: "user2@example.com",
  //   password: "dishwasher-funk"
  // }
};

// function takes in an argument of the email submitted by the user,
// and then compares it to the emails in the database

function getUserByEmail(email){
  for (let id in users){
    if(users[id].email === email){
      return users[id];
    }
  }
  return null;
};

// function takes in an argument of the unique id assigned to the user making the request,
// and compares it to the ids in the database.

function getUser(username){
  for (let id in users){
    if(users[id] === username){
      return true;
    } else {
      return false;
    }
  }
};

//URL DATABASE OBJECT

var urlDatabase = {

//Example of data structure

  // 'b2xVn2':{
  //   url:"http://www.lighthouselabs.ca",
  //   shortURL:"b2xVn2",
  //   user_id:'userRandomID'
  // },

  // '9sm5xK': {
  //   url:"http://www.google.com",
  //   shortURL:"9sm5xK",
  //   user_id:'user2RandomID'
  // }

};


 // function takes the user_id from the session as an argument, if the user_id is in the database
 // the function creates a new object just with the urls that are assigned to that user_id.

function newUserDatabase(username){

  userUrls = {}

  for(let shortURL in urlDatabase ){
    if (urlDatabase[shortURL].user_id === username){
      userUrls[shortURL] = urlDatabase[shortURL]
    }
  }
  return userUrls;
}


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

//Directs to the long url

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].url;
  res.redirect(longURL);
});

//Renders page with users urls and short urls

app.get("/urls", (req, res) => {
  const userId = req.session["user_id"];
  const userUrlDatabase = newUserDatabase(userId);
  let templateVars = {
    urls: urlDatabase,
    user: users[userId],
    userUrls: userUrlDatabase
  };
  res.render("urls_index",templateVars);
});

//Renders page with input to enter new urls

app.get("/urls/new", (req, res) => {
  const userId = req.session["user_id"];
  let templateVars = {
    user: users[userId]
  };
  if(!userId){
    res.redirect("/login");
  }
  res.render("urls_new", templateVars);
});

//Renders page that allows the user to update their urls

app.get("/urls/:id", (req, res) => {
  const userId = req.session["user_id"];
  let loggedIn = getUser(userId);
  let templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id]['url'],
    user: users[userId]
  };
  if(!userId){
    res.send('you are not logged in' + loginLink );
  }else if(loggedIn) {
    res.send('you don\'t have permission to visit this page');
  }
  res.render("urls_show", templateVars);
});

//Update the url on the main page after change

app.post("/urls/:id/update", (req, res) =>{
   urlDatabase[req.params.id].url = req.body.update
   res.redirect("/urls")
 })

app.get("/urls/urls_new", (req, res) => {
  let longURL = urlDatabase[req.params.id]
  res.redirect("/urls");
});

// Adds additionaly functionality to main urls page, allows template pages to dislay relavent information.

app.post("/urls", (req, res) => {
  const userId = req.session["user_id"]
  let shortURL = generateRandomString()
  urlDatabase[shortURL] = {
    url:req.body.longURL,
    shortURL:shortURL,
    user_id:userId
  }
  res.redirect("/urls");
});

// Button that deletes users entries and directs them back to the main urls page

app.post("/urls/:id/delete", (req, res) => {
  delete (urlDatabase[req.params.id]);
  res.redirect("/urls");
})

// Renders a login page where the user must sign in by entering their email and password

app.get("/login", (req,res) =>{
  const userId = req.session["user_id"];
  let templateVars = {
    user: users[userId]
  };
  res.render("login.ejs", templateVars);
})

// Login functionality, if username and passsword are correct users are redirected to the main urls page

app.post("/login", (req, res) =>{

  const email = req.body.email
  const password = req.body.password
  let loginLink = '<a href="/login">login <\/a>'

  if (!email|| !password){
    res.send("please enter required fields " + " " + loginLink)
    return;
  }
  let user = getUserByEmail(email)

  if(!user){
    res.send('username doesn\'t exist' + " " + loginLink )
    return;
  }
  if (bcrypt.compareSync(password, user.password)){
    req.session.user_id = user.id
    res.redirect("/urls")
  }else{
    res.send("incorrect password" + " " + loginLink)
  }
})

// Logout button, clears the session and redirects the user to the login page

app.post("/logout", (req, res) =>{
  req.session = null;
  res.redirect("/login")
})

// Renders a register page where the user must sign up using an email and passsword,
// then reidrects the user to the main login page

app.get("/register", (req, res) =>{
  const userId = req.session["user_id"];
  let templateVars = {
    user: users[userId]
  };
  res.render("register.ejs", templateVars);
})

// Resgistration functionality, hashes password and assigns a coookie session to the user.

app.post("/register", (req, res) =>{
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  let email = req.body.email;
  let registerLink = '<a href="/register">register<\/a>'

  if (!email || !password){
    res.send("please enter required fields " + " " + registerLink)
  } else if (getUserByEmail(email)){
    res.send('please choose a different username' + " " + registerLink)
  } else {

    let randomId = generateRandomString();

    users[randomId] = {
      id:randomId,
      email:req.body.email,
      password:hashedPassword

    }

    req.session.user_id = randomId

    res.redirect("/urls")
  }
});

