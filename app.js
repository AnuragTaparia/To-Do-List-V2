const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB")

//this schema is for home(localhost:3000) route
const itemsSchema = {
  name : String
}

//this model is for home(localhost:3000) route
const Item = mongoose.model("Item", itemsSchema)

const item1 = new Item({
  name: "Welcome to your Todolist"
})

const item2 = new Item({
  name: "Hit + button to add a new item"
})

const item3 = new Item({
  name: "<-- Hit this checkbox to delete the item"
})

const defaultItems = [item1, item2, item3];

//this schema is for different routes
const listSchema = {
  name: String,
  items: [itemsSchema]
}

//this model is for different routes
const List = mongoose.model("List", listSchema)

//this is for adding default items in Item model(collection)
function addDefaultItem(){
  Item.insertMany(defaultItems, function(err){
    if(err){
      console.log(err)
    } else{
      console.log("Added sucessfully!");
    }
  })
}

app.get("/", function(req, res) {

  Item.find({}, function(err, result){
    
    if(result.length === 0){
      addDefaultItem(); //this will save the data into datbase
      res.redirect("/");  //after saving data to database we have to refresh the page 
                          //instead of doing this we will rediresct to to the home route(whuch kind of mean refreshing the page)
    }

    res.render("list", {listTitle: "Today", newListItems: result});

  })
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today"){
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function(err){
      if (!err) {
        console.log("Successfully deleted checked item.");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if (!err){
        res.redirect("/" + listName);
      }
    });
  }


});

//this is for creating custom routes and adding data into it
app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);
 
  List.findOne({name: customListName}, function(err, results) {
    if (!err) {
      if (!results) {
        //creating new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save(function(err){                        //this is the fix
          if (!err) {                                   // if simply doing list.save and res.direct() 
            res.redirect('/' + customListName);         // it is making 3 colllections for one name
          }
        });
      } else {
        // showing existing list
        res.render('list', {listTitle: results.name, newListItems: results.items});
      }
    };
  })
})




app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});

