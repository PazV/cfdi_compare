$(document).ready(function(){
    var me = this;
    $("#btnOpenSatLink").click(function(){
        // window.open("https://www.sat.gob.mx/personas/factura-electronica","_blank","width=400,height=350,top=200,left=200");
        window.open("https://www.sat.gob.mx/personas/factura-electronica","_blank");
    });

    $(".collapse-div-submenu").on('show.bs.collapse',function(){
        $(this).siblings('a').children('i.icon-right-arrow-menu').css('transform','rotate(90deg')
    });

    $(".collapse-div-submenu").on('hide.bs.collapse',function(){
        $(this).siblings('a').children('i.icon-right-arrow-menu').css('transform','rotate(0deg');
    });

});
