

// type executable struct {
// 	query string
// 	getId bool
// 	args  []interface{}
// }

// func (d *Database) transact(execs []executable) []int64 {
// 	tx := d.begin()

// 	ids := make([]int64, len(execs))
// 	for i, e := range execs {
// 		stmt := tx.prepare(e.query)
// 		defer stmt.close()

// 		r := stmt.exec(tx, e.args)

// 		if e.getId {
// 			ids[i] = tx.getInsertedId(r)
// 		}
// 	}

// 	d.commit(tx)
// 	return ids
// }

// func (d *Database) prep(query string, getId bool, args ...interface{}) []executable {
// 	return []executable{executable{query: query, getId: getId, args: args}}
// }

// func (d *Database) insert(r Record) string {
// 	return fmt.Sprintf(`INSERT INTO %s (%s) VALUES (%s)`, r.table(), strings.Join(r.keys(), ", "), insertValues[len(r.values())])
// }

// func (d *Database) Insert(r Record) {
// 	r.setId(d.transact(d.prep(d.insert(r), true, r.values()))[0])
// }

// func (d *Database) Insert2(r, r2 Record) {
// 	e := d.prep(d.insert(r), true, r.values())
// 	e2 := d.prep(d.insert(r2), true, r2.values())
// 	ids := d.transact(append(e, e2...))
// 	r.setId(ids[0])
// 	r2.setId(ids[1])
// }

// func (d *Database) update(r Record) string {
// 	return fmt.Sprintf(`UPDATE %s SET %s WHERE id=%d`, r.table(), strings.Join(r.keys(), "=?, ")+"=?", r.id())
// }

// func (d *Database) Update(r Record) {
// 	d.transact(d.prep(d.update(r), false, r.values()))
// }


/*
 * Created by Mintstone 2015-10-13
*/
var canvas, stage;
var images;
var originalHolds = [];
var setA = [];
var setB = [];
var selectedHolds = [];
var selectedHoldsMarkup = [];

//constants for the holdset IDs
var origID=17635;
var AID=17653;
var BID=17671;

function showCompatHolds(holdset,showme) {
    classString = '';
    if (showme == false) {
        if (holdset == origID){
            stage.removeChild(originalHolds);
        }
        else
        {
            if (holdset == AID){
                stage.removeChild(setA);
            }
            else
            {
                stage.removeChild(setB);
            }
        }
        //now hide the holds list
        if(window.location.href.indexOf("setups") > -1) {
            var x = document.getElementsByClassName(holdset);
            var i;
            for (i = 0; i < x.length; i++) {
                x[i].style.display = "none";
                var myClass = x[i].className.replace('hold', ' ');
                x[i].className = myClass;
            }
        }
    }
    else {
        if (holdset == origID){
            stage.addChild(originalHolds);
        }
        else
        {
            if (holdset == AID){
                stage.addChild(setA);
            }
            else
            {
                stage.addChild(setB);
            }
        }
        //now show the holds list
        if(window.location.href.indexOf("setups") > -1) {
            var x = document.getElementsByClassName(holdset);
            var i;
            for (i = 0; i < x.length; i++) {
                x[i].style.display = "block";
                x[i].className += ' hold';
            }
        }
    }
    //gotta remove any holds that have been marked up (if we are on the Add a problem page)
    if(window.location.href.indexOf("add-a-problem") > -1) {
        stage.removeChild(selectedHoldsMarkup);
        clearAllHolds();
        selectedHolds = [];
    }
    stage.update();

    //stuff for the problem page
    if(window.location.href.indexOf("problems") > -1) {
        if (!stage.getChildByName('originalHolds')) {
            classString = classString + '.' + origID;
        }

        if (!stage.getChildByName('setA')) {
            classString = classString + '.' + AID;
        }

        if (!stage.getChildByName('setB')) {
            classString = classString + '.' + BID;
        }
        //alert(classString);
        //hide all problems
        /*var x = document.getElementsByClassName('Problems');
        var i;
        for (i = 0; i < x.length; i++) {
            x[i].style.display = "none";
        }
        var x = document.getElementsByClassName(classString);
        var i;
        for (i = 0; i < x.length; i++) {
           x[i].style.display = "block";
        }*/
    }
    return classString;
}

function loadProblem() {
    canvas = document.getElementById("canvas");

    stage = new createjs.Stage(canvas);

    createjs.Touch.enable(stage);

    var background = new createjs.Bitmap("/wp-content/plugins/moonboard/inc/img/emptyBoard.jpg");
    stage.addChild(background);
    stage.update();
    //led distractor
    /*var ledimage = new Image();
    ledimage.src = "/wp-content/plugins/moonboard/inc/img/led.jpg";
    var ledbitmap;
    var ledcontainer = new createjs.Container();
    stage.addChild(ledcontainer);
    for (var i = 0; i < 100; i++) {
        ledbitmap = new createjs.Bitmap(ledimage);
        ledcontainer.addChild(ledbitmap);
        ledbitmap.x = canvas.width * Math.random() | 0;
        ledbitmap.y = canvas.height * Math.random() | 0;
        ledbitmap.rotation = 360 * Math.random() | 0;
        ledbitmap.regX = ledbitmap.image.width / 2 | 0;
        ledbitmap.regY = ledbitmap.image.height / 2 | 0;
        ledbitmap.scaleX = ledbitmap.scaleY = ledbitmap.scale = Math.random() * 0.4 + 0.6;
        stage.update();
    }*/


    images = images || [];
    var manifest = [
        {src:"/wp-content/plugins/moonboard/inc/img/1.png", id:"image1"},
        {src:"/wp-content/plugins/moonboard/inc/img/2.png", id:"image2"},
        {src:"/wp-content/plugins/moonboard/inc/img/3.png", id:"image3"},
        {src:"/wp-content/plugins/moonboard/inc/img/4.png", id:"image4"},
        {src:"/wp-content/plugins/moonboard/inc/img/5.png", id:"image5"},
        {src:"/wp-content/plugins/moonboard/inc/img/6.png", id:"image6"},
        {src:"/wp-content/plugins/moonboard/inc/img/7.png", id:"image7"},
        {src:"/wp-content/plugins/moonboard/inc/img/8.png", id:"image8"},
        {src:"/wp-content/plugins/moonboard/inc/img/9.png", id:"image9"},
        {src:"/wp-content/plugins/moonboard/inc/img/10.png", id:"image10"},
        {src:"/wp-content/plugins/moonboard/inc/img/11.png", id:"image11"},
        {src:"/wp-content/plugins/moonboard/inc/img/12.png", id:"image12"},
        {src:"/wp-content/plugins/moonboard/inc/img/13.png", id:"image13"},
        {src:"/wp-content/plugins/moonboard/inc/img/14.png", id:"image14"},
        {src:"/wp-content/plugins/moonboard/inc/img/15.png", id:"image15"},
        {src:"/wp-content/plugins/moonboard/inc/img/16.png", id:"image16"},
        {src:"/wp-content/plugins/moonboard/inc/img/17.png", id:"image17"},
        {src:"/wp-content/plugins/moonboard/inc/img/18.png", id:"image18"},
        {src:"/wp-content/plugins/moonboard/inc/img/19.png", id:"image19"},
        {src:"/wp-content/plugins/moonboard/inc/img/20.png", id:"image20"},
        {src:"/wp-content/plugins/moonboard/inc/img/21.png", id:"image21"},
        {src:"/wp-content/plugins/moonboard/inc/img/22.png", id:"image22"},
        {src:"/wp-content/plugins/moonboard/inc/img/23.png", id:"image23"},
        {src:"/wp-content/plugins/moonboard/inc/img/24.png", id:"image24"},
        {src:"/wp-content/plugins/moonboard/inc/img/25.png", id:"image25"},
        {src:"/wp-content/plugins/moonboard/inc/img/26.png", id:"image26"},
        {src:"/wp-content/plugins/moonboard/inc/img/27.png", id:"image27"},
        {src:"/wp-content/plugins/moonboard/inc/img/28.png", id:"image28"},
        {src:"/wp-content/plugins/moonboard/inc/img/29.png", id:"image29"},
        {src:"/wp-content/plugins/moonboard/inc/img/30.png", id:"image30"},
        {src:"/wp-content/plugins/moonboard/inc/img/31.png", id:"image31"},
        {src:"/wp-content/plugins/moonboard/inc/img/32.png", id:"image32"},
        {src:"/wp-content/plugins/moonboard/inc/img/33.png", id:"image33"},
        {src:"/wp-content/plugins/moonboard/inc/img/34.png", id:"image34"},
        {src:"/wp-content/plugins/moonboard/inc/img/35.png", id:"image35"},
        {src:"/wp-content/plugins/moonboard/inc/img/36.png", id:"image36"},
        {src:"/wp-content/plugins/moonboard/inc/img/37.png", id:"image37"},
        {src:"/wp-content/plugins/moonboard/inc/img/38.png", id:"image38"},
        {src:"/wp-content/plugins/moonboard/inc/img/39.png", id:"image39"},
        {src:"/wp-content/plugins/moonboard/inc/img/40.png", id:"image40"},
        {src:"/wp-content/plugins/moonboard/inc/img/50.png", id:"image50"},
        {src:"/wp-content/plugins/moonboard/inc/img/51.png", id:"image51"},
        {src:"/wp-content/plugins/moonboard/inc/img/52.png", id:"image52"},
        {src:"/wp-content/plugins/moonboard/inc/img/53.png", id:"image53"},
        {src:"/wp-content/plugins/moonboard/inc/img/54.png", id:"image54"},
        {src:"/wp-content/plugins/moonboard/inc/img/55.png", id:"image55"},
        {src:"/wp-content/plugins/moonboard/inc/img/56.png", id:"image56"},
        {src:"/wp-content/plugins/moonboard/inc/img/57.png", id:"image57"},
        {src:"/wp-content/plugins/moonboard/inc/img/58.png", id:"image58"},
        {src:"/wp-content/plugins/moonboard/inc/img/59.png", id:"image59"},
        {src:"/wp-content/plugins/moonboard/inc/img/60.png", id:"image60"},
        {src:"/wp-content/plugins/moonboard/inc/img/61.png", id:"image61"},
        {src:"/wp-content/plugins/moonboard/inc/img/62.png", id:"image62"},
        {src:"/wp-content/plugins/moonboard/inc/img/63.png", id:"image63"},
        {src:"/wp-content/plugins/moonboard/inc/img/64.png", id:"image64"},
        {src:"/wp-content/plugins/moonboard/inc/img/65.png", id:"image65"},
        {src:"/wp-content/plugins/moonboard/inc/img/66.png", id:"image66"},
        {src:"/wp-content/plugins/moonboard/inc/img/67.png", id:"image67"},
        {src:"/wp-content/plugins/moonboard/inc/img/68.png", id:"image68"},
        {src:"/wp-content/plugins/moonboard/inc/img/69.png", id:"image69"},
        {src:"/wp-content/plugins/moonboard/inc/img/70.png", id:"image70"},
        {src:"/wp-content/plugins/moonboard/inc/img/71.png", id:"image71"},
        {src:"/wp-content/plugins/moonboard/inc/img/72.png", id:"image72"},
        {src:"/wp-content/plugins/moonboard/inc/img/73.png", id:"image73"},
        {src:"/wp-content/plugins/moonboard/inc/img/74.png", id:"image74"},
        {src:"/wp-content/plugins/moonboard/inc/img/75.png", id:"image75"},
        {src:"/wp-content/plugins/moonboard/inc/img/76.png", id:"image76"},
        {src:"/wp-content/plugins/moonboard/inc/img/77.png", id:"image77"},
        {src:"/wp-content/plugins/moonboard/inc/img/78.png", id:"image78"},
        {src:"/wp-content/plugins/moonboard/inc/img/79.png", id:"image79"},
        {src:"/wp-content/plugins/moonboard/inc/img/80.png", id:"image80"},
        {src:"/wp-content/plugins/moonboard/inc/img/81.png", id:"image81"},
        {src:"/wp-content/plugins/moonboard/inc/img/82.png", id:"image82"},
        {src:"/wp-content/plugins/moonboard/inc/img/83.png", id:"image83"},
        {src:"/wp-content/plugins/moonboard/inc/img/84.png", id:"image84"},
        {src:"/wp-content/plugins/moonboard/inc/img/85.png", id:"image85"},
        {src:"/wp-content/plugins/moonboard/inc/img/86.png", id:"image86"},
        {src:"/wp-content/plugins/moonboard/inc/img/87.png", id:"image87"},
        {src:"/wp-content/plugins/moonboard/inc/img/88.png", id:"image88"},
        {src:"/wp-content/plugins/moonboard/inc/img/89.png", id:"image89"},
        {src:"/wp-content/plugins/moonboard/inc/img/90.png", id:"image90"},
        {src:"/wp-content/plugins/moonboard/inc/img/91.png", id:"image91"},
        {src:"/wp-content/plugins/moonboard/inc/img/92.png", id:"image92"},
        {src:"/wp-content/plugins/moonboard/inc/img/93.png", id:"image93"},
        {src:"/wp-content/plugins/moonboard/inc/img/94.png", id:"image94"},
        {src:"/wp-content/plugins/moonboard/inc/img/95.png", id:"image95"},
        {src:"/wp-content/plugins/moonboard/inc/img/96.png", id:"image96"},
        {src:"/wp-content/plugins/moonboard/inc/img/97.png", id:"image97"},
        {src:"/wp-content/plugins/moonboard/inc/img/98.png", id:"image98"},
        {src:"/wp-content/plugins/moonboard/inc/img/99.png", id:"image99"},
        {src:"/wp-content/plugins/moonboard/inc/img/100.png", id:"image100"},
        {src:"/wp-content/plugins/moonboard/inc/img/101.png", id:"image101"},
        {src:"/wp-content/plugins/moonboard/inc/img/102.png", id:"image102"},
        {src:"/wp-content/plugins/moonboard/inc/img/103.png", id:"image103"},
        {src:"/wp-content/plugins/moonboard/inc/img/104.png", id:"image104"},
        {src:"/wp-content/plugins/moonboard/inc/img/105.png", id:"image105"},
        {src:"/wp-content/plugins/moonboard/inc/img/106.png", id:"image106"},
        {src:"/wp-content/plugins/moonboard/inc/img/107.png", id:"image107"},
        {src:"/wp-content/plugins/moonboard/inc/img/108.png", id:"image108"},
        {src:"/wp-content/plugins/moonboard/inc/img/109.png", id:"image109"},
        {src:"/wp-content/plugins/moonboard/inc/img/110.png", id:"image110"},
        {src:"/wp-content/plugins/moonboard/inc/img/111.png", id:"image111"},
        {src:"/wp-content/plugins/moonboard/inc/img/112.png", id:"image112"},
        {src:"/wp-content/plugins/moonboard/inc/img/113.png", id:"image113"},
        {src:"/wp-content/plugins/moonboard/inc/img/114.png", id:"image114"},
        {src:"/wp-content/plugins/moonboard/inc/img/115.png", id:"image115"},
        {src:"/wp-content/plugins/moonboard/inc/img/116.png", id:"image116"},
        {src:"/wp-content/plugins/moonboard/inc/img/117.png", id:"image117"},
        {src:"/wp-content/plugins/moonboard/inc/img/118.png", id:"image118"},
        {src:"/wp-content/plugins/moonboard/inc/img/119.png", id:"image119"},
        {src:"/wp-content/plugins/moonboard/inc/img/120.png", id:"image120"},
        {src:"/wp-content/plugins/moonboard/inc/img/121.png", id:"image121"},
        {src:"/wp-content/plugins/moonboard/inc/img/122.png", id:"image122"},
        {src:"/wp-content/plugins/moonboard/inc/img/123.png", id:"image123"},
        {src:"/wp-content/plugins/moonboard/inc/img/124.png", id:"image124"},
        {src:"/wp-content/plugins/moonboard/inc/img/125.png", id:"image125"},
        {src:"/wp-content/plugins/moonboard/inc/img/126.png", id:"image126"},
        {src:"/wp-content/plugins/moonboard/inc/img/127.png", id:"image127"},
        {src:"/wp-content/plugins/moonboard/inc/img/128.png", id:"image128"},
        {src:"/wp-content/plugins/moonboard/inc/img/129.png", id:"image129"},
        {src:"/wp-content/plugins/moonboard/inc/img/130.png", id:"image130"},
        {src:"/wp-content/plugins/moonboard/inc/img/131.png", id:"image131"},
        {src:"/wp-content/plugins/moonboard/inc/img/132.png", id:"image132"},
        {src:"/wp-content/plugins/moonboard/inc/img/133.png", id:"image133"},
        {src:"/wp-content/plugins/moonboard/inc/img/134.png", id:"image134"},
        {src:"/wp-content/plugins/moonboard/inc/img/135.png", id:"image135"},
        {src:"/wp-content/plugins/moonboard/inc/img/136.png", id:"image136"},
        {src:"/wp-content/plugins/moonboard/inc/img/137.png", id:"image137"},
        {src:"/wp-content/plugins/moonboard/inc/img/138.png", id:"image138"},
        {src:"/wp-content/plugins/moonboard/inc/img/139.png", id:"image139"},
        {src:"/wp-content/plugins/moonboard/inc/img/140.png", id:"image140"},
        {src:"/wp-content/plugins/moonboard/inc/img/141.png", id:"image141"},
        {src:"/wp-content/plugins/moonboard/inc/img/142.png", id:"image142"},
        {src:"/wp-content/plugins/moonboard/inc/img/143.png", id:"image143"},
        {src:"/wp-content/plugins/moonboard/inc/img/144.png", id:"image144"},
        {src:"/wp-content/plugins/moonboard/inc/img/145.png", id:"image145"},
        {src:"/wp-content/plugins/moonboard/inc/img/146.png", id:"image146"},
        {src:"/wp-content/plugins/moonboard/inc/img/147.png", id:"image147"},
        {src:"/wp-content/plugins/moonboard/inc/img/148.png", id:"image148"},
        {src:"/wp-content/plugins/moonboard/inc/img/149.png", id:"image149"}
    ]

    var queue = new createjs.LoadQueue(true);
    queue.on("fileload", handleFileLoad, this);
    queue.on("complete", handleComplete, this);
    queue.loadManifest(manifest);
}

function handleFileLoad(event) {
    var item = event.item;
    if (item.type == createjs.LoadQueue.IMAGE) {
        images.push(event.result);
    }
}

function handleComplete(event) {

    //almost done, hide the spinner
    document.getElementById('loader').style.display = "none";

    var x = document.getElementsByClassName("hold");
    //initialize
    selectedHoldsMarkup = new createjs.Container();

    //ORIGINAL SET
    originalHolds = new createjs.Container();
    originalHolds.name='originalHolds';
    for (var i = 0; i < 40; i++) {
        var elemVal = x[i].innerHTML;
        var holdInfo = elemVal.split('/');
        var holdGridRef = holdInfo[1];
        var myx = holdGridRef.substring(0, 1);
        xcoord = getX(myx);
        var myy = holdGridRef.substring(1);
        ycoord = getY(myy);
        var holdDir = holdInfo[2];
        holdRotation = getDir(holdDir);
        var bmp = new createjs.Bitmap(images[i]);
        var border = new createjs.Shape();
        //is there a start or finish hold here?
        var check = document.getElementsByName(holdGridRef);
        if(check.length != 0){
            //black?
            var id = check[0].getAttribute('id');
            //alert(id);
            if (id=="SH1" || id=="SH2" || id=="FH1" || id=="FH2") {
                border.graphics.setStrokeStyle(2).beginStroke("rgba(0,0,0,1)").drawRect(0, 0, this.width, this.height);
            } else {//or red?
                border.graphics.setStrokeStyle(2).beginStroke("rgba(255,0,0,1)").drawRect(0, 0, this.width, this.height);
            }
        }
        var container = new createjs.Container();
        container.regX = (images[i].width/2);
        container.regY = (images[i].height/2);
        container.x = (xcoord * 1);
        container.y = (ycoord * 1);
        container.addChild(border, bmp);
        container.rotation = (holdRotation * 1);
        container.addEventListener("click", function(event) {
            if(window.location.href.indexOf("add-a-problem") > -1) {
                selectedHold = convertToGridref(Math.round(event.stageX), Math.round(event.stageY));
                markUpHold(selectedHold);
            }
        });
        originalHolds.addChild(container);
    }

    stage.addChild(originalHolds);

    //lets update
    //stage.update();

    //SET A
    setA = new createjs.Container();
    setA.name='setA';
    for (var j = 40; j < 90; j++) {
        var elemVal = x[j].innerHTML;
        var holdInfo = elemVal.split('/');
        var holdGridRef = holdInfo[1];
        var myx = holdGridRef.substring(0, 1);
        xcoord = getX(myx);
        var myy = holdGridRef.substring(1);
        ycoord = getY(myy);
        var holdDir = holdInfo[2];
        var holdRotation = getDir(holdDir);

        var bmp = new createjs.Bitmap(images[j]);
        var border = new createjs.Shape();
        //is there a start or finish hold here?
        var check = document.getElementsByName(holdGridRef);
        if(check.length != 0){
            //black?
            var id = check[0].getAttribute('id');
            //alert(id);
            if (id=="SH1" || id=="SH2" || id=="FH1" || id=="FH2") {
                border.graphics.setStrokeStyle(2).beginStroke("rgba(0,0,0,1)").drawRect(0, 0, this.width, this.height);
            } else {//or red?
                border.graphics.setStrokeStyle(2).beginStroke("rgba(255,0,0,1)").drawRect(0, 0, this.width, this.height);
            }
        }
        var container = new createjs.Container();
        container.regX = (images[j].width/2);
        container.regY = (images[j].height/2);
        container.x = (xcoord * 1);
        container.y = (ycoord * 1);
        container.addChild(border, bmp);
        container.rotation = (holdRotation * 1);
        container.addEventListener("click", function(event) {
            if(window.location.href.indexOf("add-a-problem") > -1) {
                selectedHold = convertToGridref(Math.round(event.stageX), Math.round(event.stageY));
                markUpHold(selectedHold);
            }
        });
        setA.addChild(container);
    }
    stage.addChild(setA);
    //update again..
    //stage.update();

    //SET B
    setB = new createjs.Container();
    setB.name='setB';
    for (var k = 90; k < 140; k++) {
        var elemVal = x[k].innerHTML;
        var holdInfo = elemVal.split('/');
        var holdGridRef = holdInfo[1];
        var myx = holdGridRef.substring(0, 1);
        xcoord = getX(myx);
        var myy = holdGridRef.substring(1);
        ycoord = getY(myy);
        var holdDir = holdInfo[2];
        var holdRotation = getDir(holdDir);

        var bmp = new createjs.Bitmap(images[k]);
        var border = new createjs.Shape();
        //is there a start or finish hold here?
        var check = document.getElementsByName(holdGridRef);
        if(check.length != 0){
            //black?
            var id = check[0].getAttribute('id');
            //alert(id);
            if (id=="SH1" || id=="SH2" || id=="FH1" || id=="FH2") {
                border.graphics.setStrokeStyle(2).beginStroke("rgba(0,0,0,1)").drawRect(0, 0, this.width, this.height);
            } else {//or red?
                border.graphics.setStrokeStyle(2).beginStroke("rgba(255,0,0,1)").drawRect(0, 0, this.width, this.height);
            }
        }
        var container = new createjs.Container();
        container.regX = (images[k].width/2);
        container.regY = (images[k].height/2);
        container.x = (xcoord * 1);
        container.y = (ycoord * 1);
        container.addChild(border, bmp);
        container.rotation = (holdRotation * 1);
        container.addEventListener("click", function(event) {
            if(window.location.href.indexOf("add-a-problem") > -1) {
                selectedHold = convertToGridref(Math.round(event.stageX), Math.round(event.stageY));
                markUpHold(selectedHold);
            }
        });
        setB.addChild(container);
    }

    stage.addChild(setB);

    //if this is Add Problem then start with all holds hidden
    if(window.location.href.indexOf("add-a-problem") > -1) {
        stage.removeChild(originalHolds);
        stage.removeChild(setA);
        stage.removeChild(setB);
    }
    //final update
    stage.update();
}

function addMoreFields() {
    var x = document.getElementsByClassName("hide-hold");
    var i;
    //loop through all the data and populate the arrays
    for (i = 0; i < x.length; i++) {
        x[i].setAttribute("class", "");
    }
}

function previewProblem() {
    //CLEAR IT DOWN
    stage.removeChild(selectedHoldsMarkup);
    stage.update();
    selectedHoldsMarkup.removeAllChildren();
    document.getElementById("holdContainer").innerHTML = "";
    var container = document.getElementById("holdContainer");
    var holdDivs = container.innerHTML;
    //alert(holdDivs);
    var SH1 = document.getElementById("input_1_7").value;
    holdDivs = holdDivs + '<div id="SH1" name="' + SH1 + '">' + SH1 + '</div>';
    var SH2 = document.getElementById("input_1_8").value;
    holdDivs = holdDivs + '<div id="SH2" name="' + SH2 + '">' + SH2 + '</div>';
    var IH1 = document.getElementById("input_1_11").value;
    holdDivs = holdDivs + '<div id="IH1" name="' + IH1 + '">' + IH1 + '</div>';
    var IH2 = document.getElementById("input_1_12").value;
    holdDivs = holdDivs + '<div id="IH2" name="' + IH2 + '">' + IH2 + '</div>';
    var IH3 = document.getElementById("input_1_14").value;
    holdDivs = holdDivs + '<div id="IH3" name="' + IH3 + '">' + IH3 + '</div>';
    var IH4 = document.getElementById("input_1_13").value;
    holdDivs = holdDivs + '<div id="IH4" name="' + IH4 + '">' + IH4 + '</div>';
    var IH5 = document.getElementById("input_1_16").value;
    holdDivs = holdDivs + '<div id="IH5" name="' + IH5 + '">' + IH5 + '</div>';
    var IH6 = document.getElementById("input_1_15").value;
    holdDivs = holdDivs + '<div id="IH6" name="' + IH6 + '">' + IH6 + '</div>';
    var IH7 = document.getElementById("input_1_27").value;
    holdDivs = holdDivs + '<div id="IH7" name="' + IH7 + '">' + IH7 + '</div>';
    var IH8 = document.getElementById("input_1_31").value;
    holdDivs = holdDivs + '<div id="IH8" name="' + IH8 + '">' + IH8 + '</div>';
    var IH9 = document.getElementById("input_1_33").value;
    holdDivs = holdDivs + '<div id="IH9" name="' + IH9 + '">' + IH9 + '</div>';
    var IH10 = document.getElementById("input_1_34").value;
    holdDivs = holdDivs + '<div id="IH10" name="' + IH10 + '">' + IH10 + '</div>';
    var FH1 = document.getElementById("input_1_9").value;
    holdDivs = holdDivs + '<div id="FH1" name="' + FH1 + '">' + FH1 + '</div>';
    var FH2 = document.getElementById("input_1_10").value;
    holdDivs = holdDivs + '<div id="FH2" name="' + FH2 + '">' + FH2 + '</div>';
   // alert(holdDivs);
    document.getElementById("holdContainer").innerHTML = holdDivs;

    //loadBoard();
    //load all the holds
    for (index = 0; index < selectedHolds.length; ++index) {
        var border = new createjs.Shape();
        //alert(selectedHolds[index]);
        var myx = selectedHolds[index].substring(0, 1);
        xcoord = getX(myx);
        var myy = selectedHolds[index].substring(1);
        ycoord = getY(myy);
        var check = document.getElementsByName(selectedHolds[index]);
        if(check.length != 0){
            //black?
            var id = check[0].getAttribute('id');
            //alert(id);
            if (id=="SH1" || id=="SH2" || id=="FH1" || id=="FH2") {
                border.graphics.setStrokeStyle(2).beginStroke("rgba(0,0,0,1)").drawRect(0, 0, 22, 22);
            } else {//or red?
                border.graphics.setStrokeStyle(2).beginStroke("rgba(255,0,0,1)").drawRect(0, 0, 22, 22);
            }
        }
        border.regX = (22/2);
        border.regY = (22/2);
        border.x = (xcoord * 1);
        border.y = (ycoord * 1);

        selectedHoldsMarkup.addChild(border);
    }
    stage.addChild(selectedHoldsMarkup);
    stage.update();
}

function markUpHold(selectedHold) {

    //need to check that this hold has not already been added?
    if (selectedHolds.indexOf(selectedHold) > -1) {
        //remove it!
        var holdpos = selectedHolds.indexOf(selectedHold);
        selectedHolds.splice(holdpos, 1);
        deselectHold(selectedHold);
    }
    else {
        selectedHolds.push(selectedHold);
        //need to sort the selectedHolds array
        selectedHolds.sort(function(a, b) {
            var compA = parseInt(a.substr(1));
            valA=compA* 1;
            var compB = parseInt(b.substr(1));
            valB=compB* 1;
            return (valA < valB) ? -1 : (valA > valB) ? 1 : 0;
        });
        //remove all form field selections so we can re-populate
        clearAllHolds();
        //alert(selectedHolds.toString());
        for (var i = 0; i < selectedHolds.length; i++) {
            var myRow = parseInt(selectedHolds[i].substr(1));
            //alert(myRow);
            switch(true) {
                case myRow < 7:
                    if (document.getElementById("input_1_7").value == '') {
                        document.getElementById("input_1_7").value = selectedHolds[i];
                        //previewProblem();
                        break;
                    }
                    else {
                        if (document.getElementById("input_1_8").value == '') {
                            document.getElementById("input_1_8").value = selectedHolds[i];
                            //previewProblem();
                            break;
                        }
                        else {
                            intermediateHolds(i);
                        }
                    }
                //finish hold?
                case myRow >= 18:
                    if (document.getElementById("input_1_9").value == '') {
                        document.getElementById("input_1_9").value = selectedHolds[i];
                        //previewProblem();
                        break;
                    }
                    else {
                        //if (document.getElementById("input_1_10").value == '') {
                        document.getElementById("input_1_10").value = selectedHolds[i];
                        //previewProblem();
                        break;
                        //}
                        //else {
                        //    intermediateHolds(i);
                        //}
                    }
                //the rest
                default:
                    intermediateHolds(i);
                }
            }
        previewProblem();
        }
    }

function intermediateHolds(i){
switch (true) {
    case document.getElementById("input_1_11").value == '':
        document.getElementById("input_1_11").value = selectedHolds[i];
        //previewProblem();
        break;
    case document.getElementById("input_1_12").value == '':
        document.getElementById("input_1_12").value = selectedHolds[i];
        //previewProblem();
        break;
    case document.getElementById("input_1_14").value == '':
        document.getElementById("input_1_14").value = selectedHolds[i];
        //previewProblem();
        break;
    case document.getElementById("input_1_13").value == '':
        document.getElementById("input_1_13").value = selectedHolds[i];
        //previewProblem();
        break;
    case document.getElementById("input_1_16").value == '':
        document.getElementById("input_1_16").value = selectedHolds[i];
        //previewProblem();
        break;
    case document.getElementById("input_1_15").value == '':
        document.getElementById("input_1_15").value = selectedHolds[i];
        //previewProblem();
        break;
    case document.getElementById("input_1_27").value == '':
        document.getElementById("input_1_27").value = selectedHolds[i];
        //previewProblem();
        break;
    case document.getElementById("input_1_31").value == '':
        document.getElementById("input_1_31").value = selectedHolds[i];
        //previewProblem();
        break;
    case document.getElementById("input_1_33").value == '':
        document.getElementById("input_1_33").value = selectedHolds[i];
        //previewProblem();
        break;
    case document.getElementById("input_1_34").value == '':
        document.getElementById("input_1_34").value = selectedHolds[i];
        //previewProblem();
        break;
}
}
function deselectHold(selectedHold){
    if (document.getElementById("input_1_7").value == selectedHold) {
        document.getElementById("input_1_7").value = '';
        previewProblem();
        return;
    }
    if (document.getElementById("input_1_8").value == selectedHold) {
        document.getElementById("input_1_8").value = '';
        previewProblem();
        return;
    }
    if (document.getElementById("input_1_9").value == selectedHold) {
        document.getElementById("input_1_9").value = '';
        previewProblem();
        return;
    }
    if (document.getElementById("input_1_10").value == selectedHold) {
        document.getElementById("input_1_10").value = '';
        previewProblem();
        return;
    }
    if (document.getElementById("input_1_11").value == selectedHold) {
        document.getElementById("input_1_11").value = '';
        previewProblem();
        return;
    }
    if (document.getElementById("input_1_12").value == selectedHold) {
        document.getElementById("input_1_12").value = '';
        previewProblem();
        return;
    }
    if (document.getElementById("input_1_14").value == selectedHold) {
        document.getElementById("input_1_14").value = '';
        previewProblem();
        return;
    }
    if (document.getElementById("input_1_13").value == selectedHold) {
        document.getElementById("input_1_13").value = '';
        previewProblem();
        return;
    }
    if (document.getElementById("input_1_16").value == selectedHold) {
        document.getElementById("input_1_16").value = '';
        previewProblem();
        return;
    }
    if (document.getElementById("input_1_15").value == selectedHold) {
        document.getElementById("input_1_15").value = '';
        previewProblem();
        return;
    }
    if (document.getElementById("input_1_27").value == selectedHold) {
        document.getElementById("input_1_27").value = '';
        previewProblem();
        return;
    }
}

function clearAllHolds(){
    document.getElementById("input_1_7").value='';
    document.getElementById("input_1_8").value='';
    document.getElementById("input_1_11").value='';
    document.getElementById("input_1_12").value='';
    document.getElementById("input_1_14").value='';
    document.getElementById("input_1_13").value='';
    document.getElementById("input_1_16").value='';
    document.getElementById("input_1_15").value='';
    document.getElementById("input_1_27").value='';
    document.getElementById("input_1_9").value='';
    document.getElementById("input_1_10").value='';
}
function getX(myx) {
    switch (myx) {
        case 'A':
            xcoord = 62;
            break;
        case 'B':
            xcoord = 94;
            break;
        case 'C':
            xcoord = 128;
            break;
        case 'D':
            xcoord = 160;
            break;
        case 'E':
            xcoord = 193;
            break;
        case 'F':
            xcoord = 226;
            break;
        case 'G':
            xcoord = 259;
            break;
        case 'H':
            xcoord = 292;
            break;
        case 'I':
            xcoord = 325;
            break;
        case 'J':
            xcoord = 357;
            break;
        case 'K':
            xcoord = 390;
            break;
        default:
            xcoord = 0;
    }
    return xcoord;
}

function getY(myy){
    switch (myy) {
        case '1':
            ycoord = 616;
            break;
        case '2':
            ycoord = 582;
            break;
        case '3':
            ycoord = 549;
            break;
        case '4':
            ycoord = 516;
            break;
        case '5':
            ycoord = 484;
            break;
        case '6':
            ycoord = 451;
            break;
        case '7':
            ycoord = 417;
            break;
        case '8':
            ycoord = 385;
            break;
        case '9':
            ycoord = 352;
            break;
        case '10':
            ycoord = 319;
            break;
        case '11':
            ycoord = 287;
            break;
        case '12':
            ycoord = 254;
            break;
        case '13':
            ycoord = 221;
            break;
        case '14':
            ycoord = 189;
            break;
        case '15':
            ycoord = 155;
            break;
        case '16':
            ycoord = 122;
            break;
        case '17':
            ycoord = 89;
            break;
        case '18':
            ycoord = 56;
            break;
        default:
            ycoord = 0;
    }
    return ycoord;
}

function getDir(holdDir){
    switch (holdDir) {
        case 'N':
            holdRotation = 0;
            break;
        case 'NE':
            holdRotation = 45;
            break;
        case 'E':
            holdRotation = 90;
            break;
        case 'SE':
            holdRotation = 135;
            break;
        case 'S':
            holdRotation = 180;
            break;
        case 'SW':
            holdRotation = 225;
            break;
        case 'W':
            holdRotation = 270;
            break;
        case 'NW':
            holdRotation = 315;
            break;
        default:
            holdRotation = 0;
    }
    return holdRotation;
}

function convertToGridref(myx,myy) {
    switch (true) {
        case (myx > 46 && myx < 78):
            xcoord = 'A';
            break;
        case (myx > 78 && myx < 110):
            xcoord = 'B';
            break;
        case (myx > 112 && myx < 144):
            xcoord = 'C';
            break;
        case (myx > 144 && myx < 176):
            xcoord = 'D';
            break;
        case (myx > 177 && myx < 209):
            xcoord = 'E';
            break;
        case (myx > 210 && myx < 242):
            xcoord = 'F';
            break;
        case (myx > 243 && myx < 275):
            xcoord = 'G';
            break;
        case (myx > 276 && myx < 308):
            xcoord = 'H';
            break;
        case (myx > 309 && myx < 341):
            xcoord = 'I';
            break;
        case (myx > 342 && myx < 373):
            xcoord = 'J';
            break;
        case (myx > 374 && myx < 406):
            xcoord = 'K';
            break;
        default:
            xcoord = '';
    }

    switch (true) {
        case (myy > 600 && myy < 632):
            ycoord = '1';
            break;
        case (myy > 566 && myy < 598):
            ycoord = '2';
            break;
        case (myy > 533 && myy < 565):
            ycoord = '3';
            break;
        case (myy > 501 && myy < 532):
            ycoord = '4';
            break;
        case (myy > 468 && myy < 500):
            ycoord = '5';
            break;
        case (myy > 435 && myy < 467):
            ycoord = '6';
            break;
        case (myy > 402 && myy < 433):
            ycoord = '7';
            break;
        case (myy > 369 && myy < 401):
            ycoord = '8';
            break;
        case (myy > 336 && myy < 368):
            ycoord = '9';
            break;
        case (myy > 304 && myy < 335):
            ycoord = '10';
            break;
        case (myy > 271 && myy < 303):
            ycoord = '11';
            break;
        case (myy > 238 && myy < 270):
            ycoord = '12';
            break;
        case (myy > 205 && myy < 237):
            ycoord = '13';
            break;
        case (myy > 173 && myy < 205):
            ycoord = '14';
            break;
        case (myy > 139 && myy < 171):
            ycoord = '15';
            break;
        //case 122:
        case (myy > 106 && myy < 138):
            ycoord = '16';
            break;
        //case 89:
        case (myy > 73 && myy < 105):
            ycoord = '17';
            break;
       // case 56:
        case (myy > 40 && myy < 72):
            ycoord = '18';
            break;
        default:
            ycoord = '';
    }
    return xcoord + ycoord;
}

function loadBoard() {
    var problemCanvas = document.getElementById("problemCanvas");
    var problemStage = new createjs.Stage(problemCanvas);

    var background = new createjs.Bitmap("/wp-content/plugins/moonboard/inc/img/emptyBoard.jpg");
    problemStage.addChild(background);
    problemStage.update();

    //look for the holds...
    var holdImages=[];
    var holdGridRefs=[];
    var holdxCoords=[];
    var holdyCoords=[];
    var holdDirection=[];
    var x = document.getElementsByClassName("problemHold");
    var i;
    //loop through all the data and populate the arrays
    for (i = 0; i < x.length; i++) {
        var elemVal = x[i].innerHTML;
        var holdInfo = elemVal.split('/');
        var holdImage = '/wp-content/plugins/moonboard/inc/img/' + holdInfo[0] + '.png';
        holdImages.push(holdImage);
        var holdGridRef = holdInfo[1];
        holdGridRefs.push(holdGridRef);
        var myx = holdGridRef.substring(0, 1);
        switch (myx) {
            case 'A':
                xcoord = 62;
                break;
            case 'B':
                xcoord = 94;
                break;
            case 'C':
                xcoord = 128;
                break;
            case 'D':
                xcoord = 160;
                break;
            case 'E':
                xcoord = 193;
                break;
            case 'F':
                xcoord = 226;
                break;
            case 'G':
                xcoord = 259;
                break;
            case 'H':
                xcoord = 292;
                break;
            case 'I':
                xcoord = 325;
                break;
            case 'J':
                xcoord = 357;
                break;
            case 'K':
                xcoord = 390;
                break;
            default:
                xcoord = 0;
        }
        holdxCoords.push(xcoord);
        var myy = holdGridRef.substring(1);
        switch (myy) {
            case '1':
                ycoord = 616;
                break;
            case '2':
                ycoord = 582;
                break;
            case '3':
                ycoord = 549;
                break;
            case '4':
                ycoord = 516;
                break;
            case '5':
                ycoord = 484;
                break;
            case '6':
                ycoord = 451;
                break;
            case '7':
                ycoord = 417;
                break;
            case '8':
                ycoord = 385;
                break;
            case '9':
                ycoord = 352;
                break;
            case '10':
                ycoord = 319;
                break;
            case '11':
                ycoord = 287;
                break;
            case '12':
                ycoord = 254;
                break;
            case '13':
                ycoord = 221;
                break;
            case '14':
                ycoord = 189;
                break;
            case '15':
                ycoord = 155;
                break;
            case '16':
                ycoord = 122;
                break;
            case '17':
                ycoord = 89;
                break;
            case '18':
                ycoord = 56;
                break;
            default:
                ycoord = 0;
        }
        holdyCoords.push(ycoord);
        var holdDir = holdInfo[2];
        //convert to degrees
        switch (holdDir) {
            case 'N':
                holdRotation = 0;
                break;
            case 'NE':
                holdRotation = 45;
                break;
            case 'E':
                holdRotation = 90;
                break;
            case 'SE':
                holdRotation = 135;
                break;
            case 'S':
                holdRotation = 180;
                break;
            case 'SW':
                holdRotation = 225;
                break;
            case 'W':
                holdRotation = 270;
                break;
            case 'NW':
                holdRotation = 315;
                break;
            default:
                holdRotation = 0;
        }
        holdDirection.push(holdRotation);
    }

    //load all the holds
    for(var j=0;j<holdImages.length;j++){
        var img = new Image();
        img.index = j;
        img.src=holdImages[j];
        img.onload = function (event) {
            var bmp = new createjs.Bitmap(this);
            var border = new createjs.Shape();
            //is there a start or finish hold here?
            var check = document.getElementsByName(holdGridRefs[this.index]);
            if(check.length != 0){
                //black?
                var id = check[0].getAttribute('id');
                //alert(id);
                if (id=="SH1" || id=="SH2" || id=="FH1" || id=="FH2") {
                    border.graphics.setStrokeStyle(2).beginStroke("rgba(0,0,0,1)").drawRect(0, 0, this.width, this.height);
                } else {//or red?
                    border.graphics.setStrokeStyle(2).beginStroke("rgba(255,0,0,1)").drawRect(0, 0, this.width, this.height);
                }
            }
            var container = new createjs.Container();
            container.regX = (this.width/2);
            container.regY = (this.height/2);
            container.x = (holdxCoords[this.index] * 1);
            container.y = (holdyCoords[this.index] * 1);
            container.addChild(border, bmp);
            container.rotation = (holdDirection[this.index] * 1);
            problemStage.addChild(container);
            problemStage.update();
        }
    }
}




