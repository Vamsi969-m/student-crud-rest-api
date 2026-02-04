const express=require('express');
const mongoose=require('mongoose');

const app=express();

app.use(express.json());

mongoose.connect("mongodb://localhost:27017/mydatabase")
    .then(()=>console.log("MongoDB connected"))
    .catch(err=>console.log(err.nessage));

const studentSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    age:{
        type:Number,
        required:true
    },
    rollno:{
        type:Number,
        required:true,
        duplicate:true,
        unique:true
    },
    branch:{
        type:String,
        required:true
    },
    year:{
        type:Number,
        min:1,
        max:4,
        required:true
    }
});

const Student=mongoose.model('Student',studentSchema);

//create student -post api
app.post('/students',async(req,res)=>{
    try{
        const exist=await Student.findOne({rollno:req.body.rollno});
        if(exist){
            return res.status(400).json({message:"roll no already exists"});
        }
        const student=new Student(req.body);
        const savedStudent=await student.save();
        res.status(201).json(savedStudent);
    }
    catch(err){
        res.status(400).json({message:"Roll no already exists"});
    }
});

//get students - with rollno
app.get('/students',async(req,res)=>{
    try{
        const {rollno}=req.query;
        if(!rollno){
            return res.status(400).json({message : "rollno query parameter is required"});
        }
        const student=await Student.findOne({rollno});
        if(!student){
            return res.status(400).json({message:"rollno not exists"});
        }
        res.status(200).json(student);
    }
    catch(error){
        res.status(500).json({
            error:error.message,
            message:"Server error"
        });
    }
});

app.get('/students/all',async(req,res)=>{
    try{
        const student=await Student.find();
        res.status(200).json(student);
    }
    catch(err){
        res.status(500).json({message:err.message});
    }
});

app.put('/students/:rollno',async(req,res)=>{
    try{
        const updatedStudent=await Student.findOneAndUpdate({rollno:req.params.rollno},req.body,{new:true,runValidators:true});
        if(!updatedStudent){
            return res.status(404).json({message:"Student Not Found"});
        }
        res.status(200).json(updatedStudent);
    }
    catch(err){
        if(err.code===11000){
            res.status(400).json({message:"roll no already Exists"});
        }
        res.status(400).json({message:err.message});
    }
})

app.delete('/students/:rollno',async(req,res)=>{
    try{
        const deletdStudent=await Student.findOneAndDelete({rollno:req.params.rollno});
        if((!deletdStudent)){
            return res.status(404).json({message:"rollno not Exists"});
        }
    res.status(200).json({message:"Student deleted successfully"}); 
    }
    catch(err){
        res.status(500).json({message:err.message});
    }
})

app.get('/students',async(req,res)=>{
    try{
        const {rollno,branch,limit=5,page=1,year,name,age}=req.query;
    let filter={};
    if(rollno){
        filter.rollno=rollno;
    }
    if(branch){
        filter.branch=branch;
    }
    if(age){
        filter.age=age;
    }
    if(year){
        filter.year=year;
    }
    if(name){
        filter.name=name;
    }
    const skip=(page-1)*limit;
    const students=await Student.find(filter)
        .sort(sortBy)
        .skip(skip)
        .limit(Number(limit));
    const total=Student.countDocuments(filter);
    res.status(200).json({
        totalStudent:total,
        currentPage:Number(page),
        totalPages:Math.ceil(total/limit),
        data:students
    })
    }
    catch(err){
        res.status(500).json({
            err:err.message,
            message:"Server error"
        });
    }
})

app.get('/',(req,res)=>{
    res.send("Server is running");
})
let port = 5000
app.listen(port,()=>{
    console.log(`Server is running on port ${port}`);
})