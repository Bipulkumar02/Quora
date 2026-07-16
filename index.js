const express = require("express");
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
let posts = [
    {
        id:uuidv4(),
        name:"vipul",
        content:"I code in java script"
    },
    {
        id:uuidv4(),
        name:"ujjwal",
        content:"I code in java"
    },
    {
        id:uuidv4(),
        name:"Gautam",
        content:"I don't code"
    },
]
app.get("/", (req, res) => {
    res.redirect("/posts");
});
app.get("/posts/new",(req,res)=>{
    res.render("new.ejs");
})
app.post("/posts",(req,res)=>{
    // res.send("post is working");
    res.redirect("/posts");
    let{name,content}=req.body;
    let id = uuidv4();
    posts.push({id,name,content});
})
app.get("/posts",(req,res)=>{
    res.render("index.ejs", {posts} );
})

app.get("/posts/:id",(req,res)=>{
    let{id} = req.params;
    let post= posts.find((p)=>id==p.id);
    res.render("show.ejs",{post});
})
app.get("/posts/edit/:id",(req,res)=>{
    let{id} = req.params;
    let post= posts.find((p)=>id==p.id);
    res.render("edit.ejs",{post});
})

app.patch("/posts/edit/:id",(req,res)=>{
    let{id} = req.params;
    let newcontent = req.body.content;
    let post= posts.find((p)=>id==p.id);
    post.content = newcontent;
    res.redirect("/posts");
})
app.delete("/posts/delete/:id",(req,res)=>{
    let{id}=req.params;
     posts = posts.filter((p)=>id!=p.id);
    res.redirect("/posts");
})

if (process.env.NODE_ENV !== "production") {
    app.listen(8080, () => {
        console.log("Server is listening");
    });
}

module.exports = app;
