//========================================================
// Install relevant packages if neccessary
//========================================================
	
	// npm install	http
	// npm install	fs
	// npm install body-parser
	// npm install	url
	// npm install	express
	// npm install	path
	// npm install	request
	// npm install	child_process

//========================================================
var http = require("http");
var https = require('https');
var fs = require('fs');
var bodyParser =  require("body-parser");
var url = require('url');
var express = require('express');
var app = express();
var path = require('path');
var request = require('request');
const exec = require('child_process').exec;
//========================================================
app.use(express.static(__dirname + '/public')); // takes us to index.html inside public
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
//========================================================

//========================================================
// Https key and certificate.  Necessary to host https server.
//========================================================
var privateKey  = fs.readFileSync('ssl_cert_real/myserver.key', 'utf8');
var certificate = fs.readFileSync('ssl_cert_real/cert.crt', 'utf8');
var credentials = {key: privateKey, cert: certificate};

var httpsServer = https.createServer(credentials, app);

//========================================================
function display_request_name(request_name, silent)
// logs serverside 'request_name' on console silent==false.  Debugging tool.
{
  if (silent == false) {
    console.log('Inside request '+request_name);
  }

}
//========================================================
var silent = true; // if this is false, then the server will log each request on the console as that request is made.
//========================================================



//========================================================
// This is where everything starts.  We technically start at index.html, but
// index.html automatically sends us to "/begin", so it activates this .get
// the /imglists directory is a directory of .txt files each containing img file names.  Each
// .txt file denotes a task.  
//
// This function reads all the .txt files and makes a link for each of them.  Clicking on
// the link starts the task for the corresponding set of images in that .txt file
//========================================================
// app.get('/begin_old',function(req, res) {

// 	myurl = (req.originalUrl);
// 	display_request_name(myurl, silent);
// 	var files = fs.readdirSync(__dirname +"/imglists/");
// 	var links = new Array();
 
// 	for (i=0; i<files.length; i++) { // add a link for each file in /imglists
// 		links[i] = '<a href = '+ '\"imglists\\' + i.toString() + '\"' + '>' +  'task_' + i.toString() + '</a>';
// 		// Notice that each link redirects simply to the file index as a string.  This will be relevant in the
// 		// subsequent "app.get('/imglists/:num')"" call.
// 	} 
// 	//========================================================
// 	// we serve the html page dynamically by combining a template for an html page (html_top and html_bottom)
// 	// along with links, which we insert into the middle, and then serve
// 	//========================================================
// 	var html_top = ' <!DOCTYPE html><html lang=\"en\"><head><meta charset=\"UTF-8\"> \
// 		<title>Canvas Resize</title><style type=\"text/css\"></style></head><body> ';
// 	var links = links.toString().split(',').join('<br>'); //The links that show up are based on the .txt files
// 	var html_bottom = ' </body></html> ';
// 	res.send(html_top + links + html_bottom); // sending the string concatenation
// });


//========================================================
// Like app.get('/being_old'), except it picks the next
// available task instead of letting the user pick
// Next available is simply the next task listed in order of the fs.readdirSync method
// which has not yet been done "num_repeat_task" times yet.  Potential problems
// due to asynchronous acess.  
//========================================================


app.get('/begin',function(req, res) {

	var assignmentId = req.query.assignmentId;

	var task_num = req.query.task_num;

	if (task_num == null) {task_num = 1;}
	myurl = (req.originalUrl);
	display_request_name(myurl, silent);

				res.redirect(url.format({ 
       				pathname:"/imglists",
       			query: {
          			"assignmentId": assignmentId,
           			"num": task_num.toString(),
        				}
     			}));

});
//========================================================
// The following get call gets activated after the user clicks on one of the links served up by
// the above "app.get('/begin')" call.
// Notice the /:num, so we have access to the file index the link we clicked above corresponds to.
// This way, we can get the imglist which corresponds to that file.
// Finally, after getting the <imgs> array, we send the <imgs> array along
// with the task index to the actual task page.
//========================================================
app.get('/imglists',function(req, res) {

	myurl = (req.originalUrl);
	display_request_name(myurl, silent);


	var files = fs.readdirSync(__dirname +"/imglists/bike_tasks/");
	var task_num = Number(req.query.num); //task num got from url
	var text = fs.readFileSync(__dirname + '/imglists/bike_tasks/' + files[task_num],'utf8'); // get the .txt file that corresponds to task_num
	var imgs = text.split('\n');

	for (i = 0; i < imgs.length; i++) { // add the imgs to an array
		imgs[i] =  '/images/' + imgs[i] ;
		// console.log(i);
		// console.log(imgs[i]);
	    imgs[i] = '\'' + imgs[i] + '\'';
	}

	res.redirect(url.format({ //send the imgs and task_num to the actual task page in the form of a query
       pathname:"/task",
       query: {
          "imgs": imgs.toString(),
          "task_num": req.query.num,
          "assignmentId":req.query.assignmentId,
        }
     }));
});
//========================================================
// We are redirected here from "app.get('/imglists/:num')" written above
// That .get relays an array of imgs and the task_number (the task corresponds to the img array)
// to this function.  This function then serves an html/js page with the img array and task_num 
// as new variables.  Similar to the "app.get('/begin')" call, we have a top and bottom
// html template that we stick the new variables in before serving.  This served html/js page
// is where the task is actually being completed, so please review the following files closely:

// task_top.html
// task_bottom.html
// canvas.js <-- js script embedeed in  task_bottom.html

// the canvas.js page uses the dynamic img/task_num variables in order to choose 
// the correct images to be loaded for the task
//========================================================
app.get('/task',function(req, res) {

	myurl = (req.originalUrl);
	display_request_name(myurl, silent);

	var imgs = req.query.imgs;
	var task_num = req.query.task_num;
	var assignmentId = req.query.assignmentId;

    var top = fs.readFileSync(__dirname +"/public/task_top.html", 'utf8');
    var middle_img = ' <script> var imgs = [' +imgs+']; </script>'; // add imgs array as variable dynamically
    var middle_task = '<script> var task_num = '+task_num+' </script>'; // add task_num array as variable dynamically
    var middle_assignment_id = '<script> var assignmentId = '+JSON.stringify(assignmentId)+' </script>';
    var bottom = fs.readFileSync(__dirname +"/public/task_bottom.html", 'utf8');

    html = top + middle_img + middle_task + middle_assignment_id + bottom;
    //console.log(middle_assignment_id);
	res.send(html);
});
//========================================================
// this post is activated when user clicks submit button
// it takes the keypoints recorded in the website and 
// writes them into a .txt file.  The .txt file name
// contains the username and task number.  See canvas.js to see
// how the submission is posted.
//========================================================
app.post('/submit',function(req,res){
  myurl = (req.originalUrl);
  display_request_name(myurl, silent);
  
  var coords = req.body.coords;

  var coord_array = JSON.parse(coords);
  //console.log(coord_array);


  var final_coord_str = '';
  for (i=0; i < coord_array.length; i++) {
  	coords_i = coord_array[i];
  	for (j = 0; j < coords_i.length; j++) {
  		final_coord_str += coords_i[j][0].toString() + ' ';
  		final_coord_str += coords_i[j][1].toString() + ' ';
  	}
  	final_coord_str += '\n';
  }

  //console.log(final_coord_str);

  var comments = req.body.comments;
  var task_num = req.body.task_num;
  var assignmentId = req.body.assignmentId;
  var which_imgs_bad = req.body.which_imgs_bad;

  filename = 'output/'+assignmentId+'_'+'task_'+task_num+'.json'

   var myjson = {"task_num": Number(task_num), "coords": coord_array, "comments": comments, "bad_imgs": JSON.parse(which_imgs_bad)};
   var json_str= JSON.stringify(myjson);
   var fs = require('fs');
	fs.writeFile(filename, json_str, function(err) {
    if(err) {
        return console.log(err);
    }
});

});
//========================================================
httpsServer.listen(8443);
console.log('https server running at on port 8443');
//========================================================