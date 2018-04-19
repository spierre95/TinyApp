var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080
var cookieParser = require('cookie-parser')

var app = express()
app.use(cookieParser())

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

function generateRandomString() {
 let id = Math.floor((1 + Math.random()) * 0x1000000).toString(16).substring(1);
 return id
}

app.set("view engine", "ejs");

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
}

function getUserByEmail(email){
  console.log(email, 'email test')
  for (let id in users){
    if(users[id].email === email){
      return users[id];
    }
  }
  return null
}


var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.end("Hello!");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const userId = req.cookies["user_id"];
  let templateVars = {
    urls: urlDatabase,
    user: users[userId]
  };
  console.log(users)
  res.render("urls_index",templateVars);
});

app.get("/urls/new", (req, res) => {
  const userId = req.cookies["user_id"];
  let templateVars = {
    user: users[userId]
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const userId = req.cookies["user_id"];
  let templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id],
    user: users[userId]
  };
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  let shortURL = generateRandomString()
  urlDatabase[shortURL] = req.body.longURL
  res.redirect("/urls");                  // debug statement to see POST parameters                      // Respond with 'Ok' (we will replace this)
});

app.get("/urls/urls_new", (req, res) => {
  let longURL = urlDatabase[req.params.id]
  res.redirect("/urls");
});

app.post("/urls/:id/delete", (req, res) => {
  delete (urlDatabase[req.params.id])
  res.redirect("/urls")
})

app.post("/urls/:id/update", (req, res) =>{
  urlDatabase[req.params.id] = req.body.update
  res.redirect("/urls")
})

app.get("/login", (req,res) =>{
  const userId = req.cookies["user_id"];
  let templateVars = {
    user: users[userId]
  };
  res.render("login.ejs", templateVars);
})

app.post("/login", (req, res) =>{
  const email = req.body.email
  const password = req.body.password
  console.log(email);
  console.log(password);
  if (!email|| !password){
    res.send('Error 400, please enter email and password')
    return;
  }

  let user = getUserByEmail(email)

  if(!user){
    res.send('Error 403, username doesn\'t exist')
    return;
  }

  if (user.password === password){
    res.redirect("/urls")
  }else{
    res.send("Error 403, incorect password")
  }
})

app.post("/logout", (req, res) =>{
  res.clearCookie("user_id");
  res.redirect("/login")
})

app.get("/register", (req, res) =>{
  const userId = req.cookies["user_id"];
  let templateVars = {
    user: users[userId]
  };
  res.render("register.ejs", templateVars);
})

app.post("/register", (req, res) =>{
  let password = req.body.password
  let email = req.body.email

  if (!email || !password){
    res.send('Error 400, please enter email and password')
  } else if (getUserByEmail(email)){
    res.send('Error 400, email already exists')
  } else {
    let randomId = generateRandomString()

    users[randomId] = {
      id:randomId,
      email:req.body.email,
      password:req.body.password
    }
    res.cookie('user_id', randomId)
    res.redirect("/urls")
  }
});

