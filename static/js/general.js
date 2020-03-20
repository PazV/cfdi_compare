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

    if (window.location.pathname.includes('/home')){
        getHomeCompanies(1);
    }

});

function getHomeCompanies(user_id){
    var hex_colors=["#EC7063","#A569BD","#5499C7","#48C9B0","#52BE80","#F4D03F","#DC7633"];

    $.ajax({
        url:'/home/getHomeCompanies',
        data:JSON.stringify({'user_id':user_id}),
        type:'POST',
        success:function(response){
            try{
                var res=JSON.parse(response);
            }catch(err){
                ajaxError();
            }
            if (res.success){
                cont=0;
                for (var x of res.data){
                    console.log(x);
                    var active="";
                    if (cont==0){
                        active='active';
                    }
                    $("#companies_carrousel_ol").append('<li data-target="#carouselCompanies" data-slide-to="'+cont+'" class="'+active+'"></li>')
                    cont++;
                    $("#companies_carousel_div_items").append('<div class="carousel-item '+active+'"><div class="carousel-item-size" style="background-color:'+hex_colors[cont]+';"><a href="/company/'+x['company_id']+'" ><span class="span-company-name">'+x['name']+'</span></a><a href="/company/'+x['company_id']+'"><img src="/static/images/building.png" width="200" height="200" class="carousel-image-align"/></a></div></div>');

                }
            }
            else{
                $.alert({
                    theme:'dark',
                    title:'Atención',
                    content:res.msg_resonse
                });
            }
        },
        error:function(){
            $.alert({
                theme:'dark',
                title:'Atención',
                content:'Ocurrió un error, favor de intentarlo de nuevo.'
            });
        }
    });
}
