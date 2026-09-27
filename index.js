require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const session = require("express-session");
const app = express();
const port = 8080;
const path = require("path");
const methodOverride = require("method-override");
app.use(methodOverride('_method'));
const { v4: uuidv4 } = require("uuid");
app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.static(path.join(__dirname,"public")));
app.use(express.urlencoded({extended:true}));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));
const connection = mysql.createPool({
    host: process.env.TIDB_HOST,
    port: process.env.TIDB_PORT,
    user: process.env.TIDB_USER,
    password: process.env.TIDB_PASSWORD,
    database: process.env.TIDB_DATABASE,
    ssl: {
        minVersion: "TLSv1.2"
    }
});

const db = connection.promise();
//logout
app.get("/logout", function(req, res) {

    req.session.destroy(function(err) {

        if(err){
            return res.send("Error while logging out");
        }

        res.redirect("/signin");
    });

});
// chage password
app.get("/change-password", (req, res) => {

    if(req.session.userId){

        res.render("change-password.ejs");

    }else{

        res.redirect("/signin");

    }

});
// change password database
app.post("/change-password", (req, res) => {

    if (!req.session.userId) {
        return res.redirect("/signin");
    }

    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
        return res.send("New passwords do not match");
    }

    const q = `SELECT * FROM users WHERE id = ?`;

    connection.query(q, [req.session.userId], (err, result) => {

        if (err) {
            return res.send("Database error");
        }

        if (result.length === 0) {
            return res.send("User not found");
        }

        const user = result[0];

        if (user.password !== oldPassword) {
            return res.send("Current password is incorrect");
        }

        const q2 = `UPDATE users SET password = ? WHERE id = ?`;

        connection.query(
            q2,
            [newPassword, req.session.userId],
            (err, result) => {

                if (err) {
                    return res.send("Database error");
                }

                res.redirect("/signin");
                
            }
        );
    });
});
//Landing page
app.get("/", (req, res) => {
   res.render("landing.ejs");
});
// signup landing page
app.get("/signup",(req,res)=>{
    res.render("signup.ejs");
})
// signup page
app.post("/signuppage",(req,res)=>{
    let{username:username,email:email,password:password} = req.body;
    let id = uuidv4();
    let q = `INSERT INTO users(id,username,email,password) VALUES ("${id}","${username}","${email}","${password}")`;
    connection.query(q,(err,result)=>{
        if(err){return res.send(err)}
        res.redirect("/posts");
    })
});
//sigin
app.get("/signin",(req,res)=>{
    res.render("signin.ejs");
});
//signinpage
app.post("/signinpage",(req,res)=>{
    let{username:username,password:formpassword} = req.body;
    let q = `SELECT * FROM users WHERE username = "${username}"`;
    connection.query(q,(err,result)=>{
        if(err){return res.send("Something is wrong with the database!")}
        if(result.length>0){
        let user = result[0];
        if(user.password==formpassword){
            req.session.userId = user.id;
            res.redirect("/posts");
        }else{
            res.send("Invalid password");
        }
    } else{
        res.send("username does not exist!");
    }
    })
});
// new posts
app.get("/posts/new",(req,res)=>{
    if(req.session.userId){
    res.render("new.ejs");
    }else{
        res.redirect("/signin");
    }
});
app.post("/posts",(req,res)=>{
    // res.send("post is working");
    if(req.session.userId){
        let id = uuidv4();
        let {content:content} = req.body;
        let q = `INSERT INTO posts(id,user_id,content)VALUES ("${id}","${req.session.userId}","${content}")`;
        connection.query(q,(err,result)=>{
            if(err) {return res.send(err)}
            res.redirect("/posts");
        })
    }else{
        res.redirect("/signin");
    }
})
app.get("/posts",(req,res)=>{
    let q = `
        SELECT posts.*, users.username
        FROM posts
        JOIN users ON posts.user_id = users.id
    `;
    connection.query(q,(err,posts)=>{
        if(err){ return res.send(err)}
        res.render("index.ejs",{posts})
    });
   
});

app.get("/posts/:id",(req,res)=>{
    let{id} = req.params;
    let post= posts.find((p)=>id==p.id);
    res.render("show.ejs",{post});
})
app.get("/posts/edit/:id",(req,res)=>{
    let{id} = req.params;
    let q = `SELECT posts.* , users.username FROM posts JOIN users ON posts.user_id = users.id  WHERE posts.id="${id}"`;
    connection.query(q,(err,post)=>{
        if(err) { return res.send(err)}
        res.render("edit.ejs",{post:post[0]});
    });
  
})

app.patch("/posts/edit/:id",(req,res)=>{
    let{id} = req.params;
    let newcontent = req.body.content;
    let q = `SELECT * FROM posts WHERE id = "${id}"`;
    connection.query(q,(err,result)=>{
        if(err) {return res.send(err)}
        let post = result[0];
        let userid = post.user_id;
        if(String(req.session.userId) === String(userid)){
        let  q2 = `UPDATE posts SET content = "${newcontent}" WHERE id ="${id}"`;
        connection.query(q2,(err,result)=>{
            if(err) { return res.send(err)}
            res.redirect("/posts");
        })
       }else{
        res.send("You can't change other's posts!");
       }
    })
   
})
app.delete("/posts/delete/:id",(req,res)=>{
    let{id}=req.params;
    let q = `SELECT * FROM posts WHERE id = "${id}"`;
    connection.query(q,(err,result)=>{
        if(err) {return res.send(err)};
        let post = result[0];
        if(String(req.session.userId) === String(post.user_id)){
            let q2 = `DELETE FROM posts WHERE id="${id}"`;
            connection.query(q2,(err,result)=>{
                if(err){return res.send(err)}
                res.redirect("/posts");
            })
        }else{
            res.send("you can't delete other's posts");
        }
    })
})

if (process.env.NODE_ENV !== "production") {
    app.listen(8080, () => {
        console.log("Server is listening");
    });
}

module.exports = app;
