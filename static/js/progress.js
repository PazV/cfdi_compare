$(document).ready(function(){
    var me = this;
    if (window.location.pathname.includes('/cfdi/my-progress')){
        getYears("#selProgYears");
        getMonthsProgress($("#selProgYears").find("option:selected").attr("name"),2); //año,company_id
    }

    $("#selProgYears").change(function(){
        getMonthsProgress($("#selProgYears").find("option:selected").attr("name"),2);
    });

    $(".a-month-prog").click(function(){
        //CON ANIMACIÓN
        // $("#divMonthGeneral").removeClass('show-div-general');
        // $("#divMonthGeneral").addClass('animate-div-disappear');
        // $("#divMonthDetail").removeClass('hide-div');
        // $("#divMonthDetail").addClass('animate-div-appear-md');

        //SIN ANIMACIÓN
        $("#divMonthGeneral").removeClass('show-div-general').addClass('hide-div');
        $("#divMonthDetail").removeClass('hide-div').addClass('show-div-detail');
        $("#divMonthDetName").data('year',$("#selProgYears").find("option:selected").attr("name"));
        $("#divMonthDetName").data('month',this.id.substr(-3));
        $("#btnReturnDetail").removeClass('hide-div').addClass('show-div-general');
        getMonthDetailInfo($("#selProgYears").find("option:selected").attr("name"),this.id.substr(-3),2);
    });

    $("#btnReturnDetail").click(function(){
        //SIN ANIMACIÓN
        $("#divMonthGeneral").removeClass('hide-div').addClass('show-div-general');
        $("#divMonthDetail").removeClass('show-div-detail').addClass('hide-div');
        $("#btnReturnDetail").removeClass('show-div-general').addClass('hide-div');

        //CON ANIMACIÓN
        // $("#divMonthDetail").removeClass('animate-div-appear-md');
        // $("#divMonthDetail").addClass('animate-div-disappear');
        // $("#divMonthGeneral").removeClass('animate-div-disappear');
        // $("#divMonthGeneral").addClass('animate-div-appear-mg');
    });


});

function getMonthsProgress(year,company_id){
     $.ajax({
         url:'/cfdi/getMonthsProgress',
         type:'POST',
         data:JSON.stringify({'year':year,'company_id':company_id}),
         success:function(response){
             try{
                 var res=JSON.parse(response);
             }catch(err){
                ajaxError();
             }
             if (res.success){
                 var months_names=Object.keys(res.data);
                 for (x of months_names){
                     $("#am-"+x).removeClass('a-mp-green');
                     $("#am-"+x).removeClass('a-mp-gray');
                     $("#am-"+x).removeClass('a-mp-blue');
                     $("#am-"+x).removeClass('a-mp-orange');
                     $("#am-"+x).addClass(res.data[x]);
                     // $("#am-"+x).attr('href','/cfdi/month-detail/'+year+'/'+x);
                 }
             }
             else{
                 $.alert({
                     theme:'dark',
                     title:'Atención',
                     content:res.msg_response
                 });
             }
         },
         error:function(){
             $.ajax({
                 theme:'dark',
                 title:'Atención',
                 content:'Ocurrió un error, favor de intentarlo de nuevo.'
             });
         }
     });
}

function getMonthDetailInfo(year,month,company_id){
    $.ajax({
        url:'/cfdi/getMonthDetailInfo',
        type:'POST',
        data:JSON.stringify({'year':year,'month':month,'company_id':company_id}),
        success:function(response){
            try{
                var res=JSON.parse(response);
            }catch(err){
                ajaxError()
            }
            if (res.success){
                $("#divMonthInfo").empty();
                $("#divMonthDetStatus").removeClass('month-bg-green-st').removeClass('month-bg-gray-st').removeClass('month-bg-blue-st').removeClass('month-bg-orange-st').addClass(res.color_class+'-st');
                $("#divMonthDetNameParent").removeClass('month-bg-green-nm').removeClass('month-bg-gray-nm').removeClass('month-bg-blue-nm').removeClass('month-bg-orange-nm').addClass(res.color_class+'-nm');

                if (res.comparison==true){
                    for (var x of res.data){
                        $("#divMonthInfo").append('<p class="month-info"><b>'+x.split(":")[0]+':</b> '+x.split(":")[1]+'</p>');
                    }
                }
                else{
                    var company=res.data['company'];
                    var count=0;
                    for (var c of company){
                        if (count==0){
                            $("#divMonthInfo").append('<p class="month-info-title">'+c+'</p>');
                        }
                        else{
                            $("#divMonthInfo").append('<p>'+c+'</p>');
                        }
                        count+=1;
                    }
                    var sat=res.data['sat'];
                    var count2=0;
                    for (var s of sat){
                        if (count2==0){
                            $("#divMonthInfo").append('<p class="month-info-title">'+s+'</p>');
                        }
                        else{
                            $("#divMonthInfo").append('<p>'+s+'</p>');
                        }
                        count2+=1;
                    }
                }
            }
            else{
                $.alert({
                    theme:'dark',
                    title:'Atención',
                    content:res.msg_response
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
