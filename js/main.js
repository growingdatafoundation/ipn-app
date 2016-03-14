var map;
var geolocation;
var vectorSource = new ol.source.Vector({});
var mylocation=[138.599899, -34.9274284];
var myregion="";
//var mylocation=[0,140.9987875413551];
var isConnection=true;
var URL="http://api.whatgrowshere.com.au/";
var totalplan=0;
var osm="http://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=1";
var ls_data_list;
var veg_data_list;
var heat_map_url="http://biocache.ala.org.au/ws/density/map?q=";
var ls_fav_list=[];
var veg_fav_list=[];
var veg_plant_needed="N/A";
var storage=$.localStorage;

$( document ).ready(function(){
	customCheckbox(".ccheckbox");
	init_map();
	if(storage.isSet('ls_fav_list')){
		ls_fav_list=storage.get('ls_fav_list');
	};
	if(storage.isSet('veg_fav_list')){
		veg_fav_list=storage.get('veg_fav_list');
	};
	$( "#page-detail-1" ).on( "swipeleft", show_page2 );
	$( "#page-detail-2" ).on( "swiperight", show_page1 );
	
});
$( document ).on( "pagecreate", function() {
	$( "body > [data-role='panel']" ).panel();
	$( "body > [data-role='panel'] [data-role='listview']" ).listview();
});
$(document).bind("mobileinit", function(){
  $.mobile.defaultPageTransition = 'slide';
});

function init_map() {
	map = new ol.Map({
		target: 'locationMap',
		layers: [
		  new ol.layer.Tile({
			 source: new ol.source.OSM()
		  })
		],
		 view: new ol.View({
			center: ol.proj.transform([138.599899, -34.9274284], 'EPSG:4326', 'EPSG:3857'),
			zoom: 14
		  })
	});
	var vectorLayer = new ol.layer.Vector({
	  source: vectorSource
	});
    map.addLayer (vectorLayer);
	setMarker(mylocation);
	map.on('singleclick', function(evt) {
		var coord = ol.proj.transform(evt.coordinate, 'EPSG:3857', 'EPSG:4326');
		mylocation=coord;
		setMarker(mylocation);
	});
} 

function setMarker(lonlat){
	
	 var iconFeature = new ol.Feature({
	  geometry: new ol.geom.Point(new ol.proj.transform(lonlat, 'EPSG:4326', 'EPSG:3857')),
	  //geometry: new ol.proj.transform([138.599899, -34.9274284], 'EPSG:4326', 'EPSG:3857'),
	  name: 'location',
	});

	var iconStyle = new ol.style.Style({
	  image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
		anchor: [0.5, 70],
		anchorXUnits: 'fraction',
		anchorYUnits: 'pixels',
		opacity: 0.9,
		scale: 0.5,
		src: 'img/app_icons/location_pin.png'
	  }))
	});

	iconFeature.setStyle(iconStyle);

	vectorSource.clear();
	vectorSource.addFeature(iconFeature);
	
}

function customCheckbox(checkboxName){
var checkBox = $(checkboxName);
checkBox.each(function(){
	$(this).wrap( "<span class='custom-checkbox' style='background-image: url("+$(this).attr("data-image-off")+")'></span>" );
	if($(this).is(':checked')){
		$(this).parent().css("background-image",'url('+$(this).attr("data-image-on")+')');
	}
});
$(".custom-checkbox").click(function(){
	var child=$(this).children('input[type="checkbox"]');
	if(child.is(':checked')){
		$(this).css("background-image",'url('+child.attr("data-image-off")+')');
		child.prop('checked', false);
	} else {
		$(this).css("background-image",'url('+child.attr("data-image-on")+')');
		child.prop('checked', true);
	}
});
}
function find_address(){
	if($("#address").val()=="") return false;
	$.mobile.loading("show");
	
    $.post(osm+"&q="+encodeURI($("#address").val()), {}, function (data) {
		$.mobile.loading("hide");
		//alert(JSON.stringify(data));
		if(data.length>0){
			mylocation=[parseFloat(data[0].lon),parseFloat(data[0].lat)];
			//alert(JSON.stringify(mylocation));
			setMarker(mylocation);
			map.getView().setCenter(ol.proj.transform(mylocation, 'EPSG:4326', 'EPSG:3857'));
		}
    }, 'json').fail(function () {
        show_alert('Connection error');
        $.mobile.loading("hide");

    });
}
function click_landscape(){
	$.mobile.loading("show");

    $.post(URL+"plant/location", {
        lat: mylocation[1],
		lng: mylocation[0],

    }, function (data) {
	
		ls_data_list=data;
		$.mobile.loading("hide");
		var str="";
		for(var i=0;i<data.plants.length;i++){
			 var formimg='<img src="img/app_icons/nothumbnail.png">';
			
			 if (typeof data.plants[i].thumbnail.cache !== "undefined" && data.plants[i].thumbnail.cache !="") {
				formimg='<img src="data:image/png;base64,'+data.plants[i].thumbnail.cache+'">';
			 }
			 
			 var starimg='<img class="fav-icon-list" src="img/app_icons/star_off.png" onclick="add_ls_list(\''+data.plants[i].botanical_name+'\',this)"/>';
			 for(var j=0;j<ls_fav_list.length;j++){
				if(ls_fav_list[j].botanical_name==data.plants[i].botanical_name){
					 starimg='<img class="fav-icon-list" src="img/app_icons/star_on.png" onclick="remove_ls_list(\''+data.plants[i].botanical_name+'\',this)"/>';
				}
			 }
			 
			 var occurrences="";
			 if (typeof data.plants[i].occurrences !== "undefined" && data.plants[i].occurrences!=""){
				occurrences=' - Occurrences: '+data.plants[i].occurrences;
			 }
			 
			 
			 str+='<li onclick="open_detail(\''+data.plants[i].botanical_name+'\',\'list\',\'ls\')">'+formimg+'<h3>'+data.plants[i].botanical_name+'</h3><p>'+data.plants[i].common_name+occurrences+'</p>'+starimg+'</li>';
		}
		if (typeof data.region !== "undefined" && data.region!="") {
			$(".region-name-header").html(' - '+data.region);
			myregion=data.region;
		}
		$("#ls-plant-list").html(str);
		
		$( ":mobile-pagecontainer" ).pagecontainer( "change", "#plant-list-landscape", { role: "page" } );
		$("#ls-plant-list").listview( "refresh" );
    }, 'json').fail(function () {
        show_alert('Connection error');
        $.mobile.loading("hide");

    });
}
function click_revegetate(){
	$.mobile.loading("show");

    $.post(URL+"plant/location", {
        lat: mylocation[1],
		lng: mylocation[0],

    }, function (data) {
	
		veg_data_list=data;
		$.mobile.loading("hide");
		var str="";
		for(var i=0;i<data.plants.length;i++){
			 var formimg='<img src="img/app_icons/form1_off.png">';
			
			 if (typeof data.plants[i].form !== "undefined" && data.plants[i].form !="") {
				formimg='<img src="img/app_icons/form'+data.plants[i].form+'_on.png">';
			 }
			 
			 var starimg='<img class="fav-icon-list" src="img/app_icons/star_off.png" onclick="add_veg_list(\''+data.plants[i].botanical_name+'\',this)"/>';
			 for(var j=0;j<veg_fav_list.length;j++){
				if(veg_fav_list[j].botanical_name==data.plants[i].botanical_name){
					 starimg='<img class="fav-icon-list" src="img/app_icons/star_on.png" onclick="remove_veg_list(\''+data.plants[i].botanical_name+'\',this)"/>';
				}
			 }
			 
			 str+='<li onclick="open_detail(\''+data.plants[i].botanical_name+'\',\'list\',\'veg\')">'+formimg+'<h3>'+data.plants[i].botanical_name+'</h3><p>'+data.plants[i].common_name+' - Occurences: '+data.plants[i].rain+'</p>'+starimg+'</li>';
		}
		if (typeof data.region !== "undefined" && data.region!="") {
			$(".region-name-header").html(' - '+data.region);
			myregion=data.region;
		}
		$("#veg-plant-list").html(str);
		
		$( ":mobile-pagecontainer" ).pagecontainer( "change", "#plant-list-revegetate", { role: "page" } );
		$("#veg-plant-list").listview( "refresh" );
    }, 'json').fail(function () {
        show_alert('Connection error');
        $.mobile.loading("hide");

    });
}
function click_landscape_myplant(){
	$.mobile.loading("show");
   
		$.mobile.loading("hide");
		var str="";
		for(var i=0;i<ls_fav_list.length;i++){
			 var formimg='<img src="img/app_icons/form1_off.png">';
			
			 if (typeof ls_fav_list[i].form !== "undefined" && ls_fav_list[i].form !="") {
				formimg='<img src="img/app_icons/form'+ls_fav_list[i].form+'_on.png">';
			 }
			 
			 var starimg='<img class="fav-icon-list" src="img/app_icons/star_on.png" onclick="remove_ls_list_myplant(\''+ls_fav_list[i].botanical_name+'\',this)"/>';
			
			 
			 str+='<li onclick="open_detail(\''+ls_fav_list[i].botanical_name+'\',\'fav\',\'ls\')">'+formimg+'<h3>'+ls_fav_list[i].botanical_name+'</h3><p>'+ls_fav_list[i].common_name+' - Occurences: '+ls_fav_list.rain+'</p>'+starimg+'</li>';
		}
		
		$("#my-plan-list-list").html(str);
		
		$( ":mobile-pagecontainer" ).pagecontainer( "change", "#my-plant-list", { role: "page" } );
		$("#my-plan-list-list").listview( "refresh" );
   
}
function add_ls_list(bname,el){
	event.stopPropagation();
	console.log( bname );
	for(var i=0;i<ls_data_list.plants.length;i++){
		var data_plan=ls_data_list.plants[i];
		if(data_plan.botanical_name==bname){
			ls_fav_list.push(data_plan);
			$(el).attr("src","img/app_icons/star_on.png");
			$(el).attr('onclick','remove_ls_list("'+bname+'",this)');
			storage.set('ls_fav_list',ls_fav_list);
			return;
		}
	}
}
function remove_ls_list(bname,el){
	event.stopPropagation();
	console.log( bname );
	for(var i=0;i<ls_fav_list.length;i++){
		var data_plan=ls_fav_list[i];
		if(data_plan.botanical_name==bname){
			ls_fav_list.splice(i, 1);
			$(el).attr("src","img/app_icons/star_off.png");
			$(el).attr('onclick','add_ls_list("'+bname+'",this)');
			storage.set('ls_fav_list',ls_fav_list);
			return;
		}
	}
}
function remove_ls_list_myplant(bname,el){
	event.stopPropagation();
	console.log( bname );
	for(var i=0;i<ls_fav_list.length;i++){
		var data_plan=ls_fav_list[i];
		if(data_plan.botanical_name==bname){
			ls_fav_list.splice(i, 1);
			$(el).parent().hide("fast");
			
			storage.set('ls_fav_list',ls_fav_list);
			return;
		}
	}
}
function click_revegetate_myplant(){
	$.mobile.loading("show");
   
		$.mobile.loading("hide");
		var str="";
		for(var i=0;i<veg_fav_list.length;i++){
			 var formimg='<img src="img/app_icons/form1_off.png">';
			
			 if (typeof veg_fav_list[i].form !== "undefined" && veg_fav_list[i].form !="") {
				formimg='<img src="img/app_icons/form'+veg_fav_list[i].form+'_on.png">';
			 }
			 
			 var starimg='<img class="fav-icon-list" src="img/app_icons/star_on.png" onclick="remove_veg_list_myplant(\''+veg_fav_list[i].botanical_name+'\',this)"/>';
			
			 
			 str+='<li onclick="open_detail(\''+veg_fav_list[i].botanical_name+'\',\'fav\',\'veg\')">'+formimg+'<h3>'+veg_fav_list[i].botanical_name+'</h3><p>'+veg_fav_list[i].common_name+' - Occurences: '+veg_fav_list.rain+'</p>'+starimg+'</li>';
		}
		$("#my-area-plant-info").html("Your location area will need "+veg_plant_needed+" plants from the following options. You will need a ratio of 1 tree to 2 shrubs to 4 groundcorvers.");
		$("#my-area-plan-list-list").html(str);
		
		$( ":mobile-pagecontainer" ).pagecontainer( "change", "#my-area-plant-list", { role: "page" } );
		$("#my-area-plan-list-list").listview( "refresh" );
   
}
function add_veg_list(bname,el){
	event.stopPropagation();
	console.log( bname );
	for(var i=0;i<veg_data_list.plants.length;i++){
		var data_plan=veg_data_list.plants[i];
		if(data_plan.botanical_name==bname){
			veg_fav_list.push(data_plan);
			$(el).attr("src","img/app_icons/star_on.png");
			$(el).attr('onclick','remove_veg_list("'+bname+'",this)');
			storage.set('veg_fav_list',veg_fav_list);
			return;
		}
	}
}
function remove_veg_list(bname,el){
	event.stopPropagation();
	console.log( bname );
	for(var i=0;i<veg_fav_list.length;i++){
		var data_plan=veg_fav_list[i];
		if(data_plan.botanical_name==bname){
			veg_fav_list.splice(i, 1);
			$(el).attr("src","img/app_icons/star_off.png");
			$(el).attr('onclick','add_veg_list("'+bname+'",this)');
			storage.set('veg_fav_list',veg_fav_list);
			return;
		}
	}
}
function remove_veg_list_myplant(bname,el){
	event.stopPropagation();
	console.log( bname );
	for(var i=0;i<veg_fav_list.length;i++){
		var data_plan=veg_fav_list[i];
		if(data_plan.botanical_name==bname){
			veg_fav_list.splice(i, 1);
			$(el).parent().hide("fast");
			
			storage.set('veg_fav_list',veg_fav_list);
			return;
		}
	}
}
function search_plant(){
	var form_data=$( "#search-plant-form" ).serialize();
	console.log( form_data );
	$.mobile.loading("show");

    $.post(URL+"plant/search", form_data+"&region="+myregion+"&lat="+mylocation[1]+"&lng="+mylocation[0]
	, function (data) {
	
		ls_data_list=data;
		$.mobile.loading("hide");
		var str="";
		for(var i=0;i<data.plants.length;i++){
			 var formimg='<img src="img/app_icons/form1_off.png">';
			
			 if (typeof data.plants[i].form !== "undefined" && data.plants[i].form !="") {
				formimg='<img src="img/app_icons/form'+data.plants[i].form+'_on.png">';
			 }
			 
			 var starimg='<img class="fav-icon-list" src="img/app_icons/star_off.png" onclick="add_ls_list(\''+data.plants[i].botanical_name+'\',this)"/>';
			 for(var j=0;j<ls_fav_list.length;j++){
				if(ls_fav_list[j].botanical_name==data.plants[i].botanical_name){
					 starimg='<img class="fav-icon-list" src="img/app_icons/star_on.png" onclick="remove_ls_list(\''+data.plants[i].botanical_name+'\',this)"/>';
				}
			 }
			 
			 str+='<li onclick="open_detail(\''+data.plants[i].botanical_name+'\',\'list\',\'ls\')">'+formimg+'<h3>'+data.plants[i].botanical_name+'</h3><p>'+data.plants[i].common_name+' - Occurences: '+data.plants[i].rain+'</p>'+starimg+'</li>';
		}
		if (typeof data.region !== "undefined" && data.region!="") {
			$(".region-name-header").html(' - '+data.region);
		}
		$("#ls-plant-list").html(str);
		
		$( ":mobile-pagecontainer" ).pagecontainer( "change", "#plant-list-landscape", { role: "page" } );
		$("#ls-plant-list").listview( "refresh" );
    }, 'json').fail(function () {
        show_alert('Connection error');
        $.mobile.loading("hide");

    });
}
function open_detail(bname,type,atype){ 
	// type: favourite or list, atype: landscape or revegetate
	$.mobile.loading("show");
	if(type=="fav"){
		if(atype=="ls"){
			var list_plants=ls_fav_list;
		} else {
			var list_plants=veg_fav_list;
		}
	} else {
		if(atype=="ls"){
			var list_plants=ls_data_list.plants;
		} else {
			var list_plants=veg_data_list.plants;
		}
	}
	if(atype=="ls"){ // add red/green classs
		$("#plant-detail").removeClass("red");
		$("#plant-detail").addClass("green");
	} else {
		$("#plant-detail").removeClass("green");
		$("#plant-detail").addClass("red");
	}
	for(var i=0;i<list_plants.length;i++){
		var data_plan=list_plants[i];
		if(data_plan.botanical_name==bname){
			console.log(data_plan);
			 
			var formimg='<img src="img/app_icons/form1_off.png" class="h2-logo">';
			
			if (typeof data_plan.form !== "undefined" && data_plan.form!="") {
				formimg='<img src="img/app_icons/form'+data_plan.form+'_on.png" class="h2-logo">';
			}
			var str=formimg+'<h2>'+data_plan.botanical_name+'</h2><div class="page-intro">'+data_plan.common_name+'</div>';
			$("#plant-detail-header").html(str);
			
			var thumbnailitem="";
			 if (typeof data_plan.thumbnail.cache !== "undefined" && data_plan.thumbnail.cache !="") {
				thumbnailitem='<img src="data:image/png;base64,'+data_plan.thumbnail.cache+'"/>';
			 }
			 $("#page-detail-thumbnail").html(thumbnailitem);
			 
			var formitem='N/A';
			if (typeof data_plan.form !== "undefined" && data_plan.form!="") {
				formitem='<img src="img/app_icons/form'+data_plan.form+'_on.png"/>';
			}
			$("#page-detail-form").html(formitem);
			
			var heightitem='N/A';
			if (typeof data_plan.height !== "undefined" && typeof data_plan.height[0] !== "undefined" && typeof data_plan.height[1] !== "undefined"  ) {
				heightitem=data_plan.height[0]+' - '+data_plan.height[1];
			}
			$("#page-detail-height").html(heightitem);
			
			var spreaditem='N/A';
			if (typeof data_plan.spread !== "undefined" && typeof data_plan.spread[0] !== "undefined" && typeof data_plan.spread[1] !== "undefined"  ) {
				spreaditem=data_plan.spread[0]+' - '+data_plan.spread[1];
			}
			$("#page-detail-spread").html(spreaditem);
			
			var coloritem='N/A';
			if (typeof data_plan.flower_colour !== "undefined") {
				coloritem='';
				for(var i=0;i<data_plan.flower_colour.length;i++){
					coloritem+='<img src="img/app_icons/colour_'+data_plan.flower_colour[i]+'_on.png"/>';
				}
				if(coloritem=='') coloritem='N/A';
			}
			$("#page-detail-color").html(coloritem);
			
			var seasonitem='N/A';
			if (typeof data_plan.flower_time !== "undefined") {
				seasonitem='';
				for(var i=0;i<data_plan.flower_time.length;i++){
					seasonitem+='<img src="img/app_icons/season_'+data_plan.flower_time[i]+'_on.png"/>';
				}
				if(seasonitem=='') seasonitem='N/A';
			}
			$("#page-detail-season").html(seasonitem);
			
			var attractitem='N/A';
			if (typeof data_plan.attracts !== "undefined") {
				attractitem='';
				for(var i=0;i<data_plan.attracts.length;i++){
					attractitem+='<img src="img/app_icons/attracts_'+data_plan.attracts[i]+'_on.png"/>';
				}
				if(attractitem=='') attractitem='N/A';
			}
			$("#page-detail-attract").html(attractitem);
			
			var heatmapitem='<img src="'+heat_map_url+data_plan.botanical_name+'"/>';
			$("#page-detail-heatmap").html(heatmapitem);
			
			$( ":mobile-pagecontainer" ).pagecontainer( "change", "#plant-detail", { role: "page" } ); 
			$.mobile.loading("hide");
			return;
		}
	}
	$.mobile.loading("hide");
	
    
}
function show_page1(){
	$("#page-detail-2").hide("fast",function (){ $("#page-detail-1").show("fast"); });
}
function show_page2(){
	$("#page-detail-1").hide("fast",function (){ $("#page-detail-2").show("fast"); });
}
function get_square(){
	if($( "#swidth" ).val()!="" && $( "#sheight" ).val()!=""){
		var sq=$( "#swidth" ).val()*$( "#sheight" ).val();
		//$("#square").attr("value",);
		$("#square").val(sq);
	}
}
function square_calculate(){
	if($( "#square" ).val()!=""){
		veg_plant_needed=$( "#square" ).val();
		var str='You will need '+$( "#square" ).val() + ' plants.<br/>It includes '+Math.round(0.2*$( "#square" ).val()) + ' trees/shrubs and '+Math.round(0.8*$( "#square" ).val()) + ' ground cover  plants';
		$("#calculate-result").html(str);
		totalplan=$( "#square" ).val();
	}
}
function hectare_calculate(){
	if($( "#hectare" ).val()!=""){
		veg_plant_needed=($( "#hectare" ).val()*10000);
		var str='You will need '+($( "#hectare" ).val()*10000) + ' plants.<br/>It includes '+($( "#hectare" ).val()*10000*0.8) +  ' trees/shrubs and '+($( "#hectare" ).val()*10000*0.8) + ' ground cover plants';
		$("#calculate-result").html(str);
		totalplan=$( "#hectare" ).val();
	}
}

function show_alert(mes){
	alert(mes);
}

function openlink(link){
	window.open(link);
}
function export_email(){
        window.location.href = "mailto:?subject=Subject&body=message%20goes%20here";
}