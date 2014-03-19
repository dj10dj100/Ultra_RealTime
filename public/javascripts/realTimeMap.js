/* start Sockets */
var socket = io.connect();
var map;
var markers = Array();
var LatLngList = Array();

function init() {

    if (!Detector.webgl) {
        Detector.addGetWebGLMessage();
        return;
    }

    var container = document.getElementById('map-div');

    map = new google.maps.Map(container, {
        zoom: 3,
        mapTypeControl: false,
        center: new google.maps.LatLng(10, 0),
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        disableDefaultUI: true,
        styles: styles
    });


}


function generateMarker(data) {

    var latLng = new google.maps.LatLng(data.info.geo.coordinates[0], data.info.geo.coordinates[1]);
    LatLngList.push(latLng);
    var marker = new google.maps.Marker({
        position: latLng,
        map: map,
        animation: google.maps.Animation.DROP,
        icon: data.info.user.profile_image_url,
        title: data.info.text,
        twitterData: data
    });

    markers.push(marker);
    map.panTo(marker.getPosition());
    //map.setZoom(22);
    fitBounds();

    google.maps.event.addListener(marker, 'click', function() {

        var infowindow = new google.maps.InfoWindow({
            content: data.info.text
        });

        console.log(marker.twitterData);

        infowindow.open(map, marker);
        map.panTo(marker.getPosition());
    });

    $('tweets ul').prepend('<li>' + data.info.text + '</li>');


}

function fitBounds() {

    var bounds = new google.maps.LatLngBounds();
    for (var i = 0, LtLgLen = LatLngList.length; i < LtLgLen; i++) {
        bounds.extend(LatLngList[i]);
    }
    map.fitBounds(bounds);
}



document.addEventListener('DOMContentLoaded', init, false);


$(document).ready(function() {

    $('.search').on('click', function(e) {

        e.preventDefault();
        var val = $('.search-box').val();
        socket.emit('get-tweets', val);
        $('.name').val('');

    });


    socket.on('tweets-present', function(data) {
        if (data) {
            console.log(data);
            if (data['info']['geo'] != null) {
                generateMarker(data);
                //data['info']['geo']['coordinates'][0], data['info']['geo']['coordinates'][1], data.info, data.info
            } else {

                var img = "<img src='" + data.info.user.profile_image_url + "' width='50' height='50' />"
                $('tweets ul').prepend('<li>' + data.info.text + '</li>');
            }
        }
    })

    socket.on('sentiment-update', function(data) {
        $('happiness h3 span').html(data.info);
    });

    circle();



});


function circle() {

    // Custom Arc Attribute, position x&y, value portion of total, total value, Radius
    var archtype = Raphael("canvas", 200, 100);
    archtype.customAttributes.arc = function(xloc, yloc, value, total, R) {
        var alpha = 360 / total * value,
            a = (90 - alpha) * Math.PI / 180,
            x = xloc + R * Math.cos(a),
            y = yloc - R * Math.sin(a),
            path;
        if (total == value) {
            path = [
                ["M", xloc, yloc - R],
                ["A", R, R, 0, 1, 1, xloc - 0.01, yloc - R]
            ];
        } else {
            path = [
                ["M", xloc, yloc - R],
                ["A", R, R, 0, +(alpha > 180), 1, x, y]
            ];
        }
        return {
            path: path
        };
    };

    //make an arc at 50,50 with a radius of 30 that grows from 0 to 40 of 100 with a bounce
    var my_arc = archtype.path().attr({
        "stroke": "#f00",
        "stroke-width": 14,
        arc: [50, 50, 0, 100, 30]
    });

    my_arc.animate({
        arc: [50, 50, 40, 100, 30]
    }, 1500, "bounce");

}