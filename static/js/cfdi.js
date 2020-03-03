$(document).ready(function(){
    var me = this;

    if (window.location.pathname.includes('/cfdi/load-company-file')){
        getYears("#selCFYears");
    }
    if (window.location.pathname.includes('/cfdi/load-sat-file')){
        getYears("#selSFYears");
    }
    if (window.location.pathname.includes('/cfdi/compare')){
        getYears("#selComparingYears");
    }

    $("#company_file").on('change',function(){
        var path=$("#company_file")[0].value.split("\\").pop();
        $("#company_file").siblings("label").html(path);
        var input_id=$(this)[0].id;
        var pattern=$(this)[0].pattern.split(",");
        var span="#spn"+input_id;
        if (hasExtension(input_id,pattern)){
            $(this).removeClass("file-input");
            $(this).siblings('label').removeClass("invalid-file-field");
            $(this).siblings('label').addClass("valid-file-field");
            $(span).html("Error");
            $(span).removeClass("show-error").addClass("hide-error");
        }
        else{
            $(this).removeClass("file-input");
            $(this).siblings('label').removeClass("valid-file-field");
            $(this).siblings('label').addClass("invalid-file-field");
            $(span).html("Formato incorrecto");
            $(span).removeClass("hide-error").addClass("show-error");
        }
        this.blur();
    });

    $("#sat_file").on('change',function(){
        var path=$("#sat_file")[0].value.split("\\").pop();
        $("#sat_file").siblings("label").html(path);
        var input_id=$(this)[0].id;
        var pattern=$(this)[0].pattern.split(",");
        var span="#spn"+input_id;
        if (hasExtension(input_id,pattern)){
            $(this).removeClass("file-input");
            $(this).siblings('label').removeClass("invalid-file-field");
            $(this).siblings('label').addClass("valid-file-field");
            $(span).html("Error");
            $(span).removeClass("show-error").addClass("hide-error");
        }
        else{
            $(this).removeClass("file-input");
            $(this).siblings('label').removeClass("valid-file-field");
            $(this).siblings('label').addClass("invalid-file-field");
            $(span).html("Formato incorrecto");
            $(span).removeClass("hide-error").addClass("show-error");
        }
        this.blur();
    });

    $("#btnLoadCompanyInfo").click(function(){
        $("#company_file").focusout();
        if( $("#company_file").siblings('label').hasClass('valid-file-field')){
            //verificar si ya existe registro del mes y año seleccionado
            $.ajax({
                url:'/cfdi/checkCompanyExistingRecords',
                type:'POST',
                data:JSON.stringify({'company_id':2,'month':$("#selCFMonths").find("option:selected").attr("name"),'year':$("#selCFYears").find("option:selected").attr("name")}),
                success:function(response){
                    try{
                        var res=JSON.parse(response);
                    }catch(err){
                        ajaxError();
                    }
                    if (res.success){
                        var data = new FormData();
                        data.append('company_id',2); //valor de company_id temporal
                        data.append('month',$("#selCFMonths").find("option:selected").attr("name"));
                        data.append('year',$("#selCFYears").find("option:selected").attr("name"));
                        var file = $("#company_file")[0].files[0];
                        var file_name = $("#company_file")[0].files[0].name;
                        data.append(file_name,file);
                        data.append('file_name',file_name);
                        if (res.exists){
                            data.append('exists','replace'); //indica que la tabla ya existe y hay que reemplazar los registros
                            $.confirm({
                                theme:'dark',
                                title:'Atención',
                                content:res.msg_confirm,
                                buttons:{
                                    confirm:{
                                        text:'Sí',
                                        action:function(){
                                            $.ajax({
                                                url:'/cfdi/loadCompanyInfo',
                                                type:'POST',
                                                processData:false,
                                                contentType:false,
                                                data:data,
                                                success:function(response2){
                                                    try{
                                                        var res2 = JSON.parse(response2);
                                                    }catch(err){
                                                        ajaxError();
                                                    }
                                                    if (res2.success){
                                                        $.alert({
                                                            theme:'dark',
                                                            title:'Atención',
                                                            content:res2.msg_response,
                                                            buttons:{
                                                                confirm:{
                                                                    text:'Aceptar',
                                                                    action:function(){
                                                                        window.location.reload();
                                                                    }
                                                                }
                                                            }
                                                        });
                                                    }
                                                    else{
                                                        $.alert({
                                                            theme:'dark',
                                                            title:'Atención',
                                                            content:res2.msg_response
                                                        });
                                                    }
                                                },
                                                error:function(){
                                                    $.alert({
                                                        theme:'dark',
                                                        title:'Atención',
                                                        content:'Ocurrió un error, favor de intentarlo de nuevo.'
                                                    })
                                                }
                                            });
                                        }
                                    },
                                    cancel:{
                                        text:'No'
                                    }
                                }
                            })
                        }
                        else{
                            data.append('exists','create'); //indica que la tabla no existe y hay que crearla
                            $.ajax({
                                url:'/cfdi/loadCompanyInfo',
                                type:'POST',
                                processData:false,
                                contentType:false,
                                data:data,
                                success:function(response2){
                                    try{
                                        var res2 = JSON.parse(response2);
                                    }catch(err){
                                        ajaxError();
                                    }
                                    if (res.success){
                                        $.alert({
                                            theme:'dark',
                                            title:'Atención',
                                            content:res2.msg_response,
                                            buttons:{
                                                confirm:{
                                                    text:'Aceptar',
                                                    action:function(){
                                                        window.location.reload();
                                                    }
                                                }
                                            }
                                        });
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
                        content:'Ocurrió un error, favor de intentarlo de nuevo más tarde.'
                    });
                }
            });
        }
        else{
            $.alert({
                theme:'dark',
                title:'Atención',
                content:'Debes agregar un archivo para poder cargarlo.'
            });
        }
    });

    $("#btnLoadSatInfo").click(function(){
        $("#sat_file").focusout();
        if ($("#sat_file").siblings('label').hasClass('valid-file-field')){
            //verificar si ya existe registro del año y mes seleccionado
            $.ajax({
                url:'/cfdi/checkSatExistingRecords',
                type:'POST',
                data:JSON.stringify({'company_id':2,'month':$("#selSFMonths").find("option:selected").attr("name"),'year':$("#selSFYears").find("option:selected").attr("name")}),
                success:function(response){
                    try{
                        var res=JSON.parse(response);
                    }catch(err){
                        ajaxError();
                    }
                    if (res.success){
                        var data = new FormData();
                        data.append('company_id',2);
                        data.append('month',$("#selSFMonths").find("option:selected").attr("name"));
                        data.append('year',$("#selSFYears").find("option:selected").attr("name"));
                        var file = $("#sat_file")[0].files[0];
                        var file_name = $("#sat_file")[0].files[0].name;
                        data.append(file_name,file);
                        data.append('file_name',file_name);
                        if (res.exists){
                            data.append('exists','replace'); //indica que la tabla ya existe y hay que reemplazar los registros
                            $.confirm({
                                theme:'dark',
                                title:'Atención',
                                content:res.msg_response,
                                buttons:{
                                    confirm:{
                                        text:'Sí',
                                        action:function(){
                                            $.ajax({
                                                url:'/cfdi/loadSatInfo',
                                                type:'POST',
                                                processData:false,
                                                contentType:false,
                                                data:data,
                                                success:function(response2){
                                                    try{
                                                        var res2 = JSON.parse(response2);
                                                    }catch(err){
                                                        ajaxError();
                                                    }
                                                    if (res2.success){
                                                        $.alert({
                                                            theme:'dark',
                                                            title:'Atención',
                                                            content:res2.msg_response,
                                                            buttons:{
                                                                confirm:{
                                                                    text:'Aceptar',
                                                                    action:function(){
                                                                        window.location.reload();
                                                                    }
                                                                }
                                                            }
                                                        })
                                                    }
                                                    else{
                                                        $.alert({
                                                            theme:'dark',
                                                            title:'Atención',
                                                            content:res2.msg_response
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
                                    }
                                }
                            })
                        }
                        else{
                            data.append('exists','create'); //indica que la tabla no existe y hay que crearla
                            $.ajax({
                                url:'/cfdi/loadSatInfo',
                                type:'POST',
                                processData:false,
                                contentType:false,
                                data:data,
                                success:function(response2){
                                    try{
                                        var res2 = JSON.parse(response2);
                                    }catch(err){
                                        ajaxError();
                                    }
                                    if (res2.success){
                                        $.alert({
                                            theme:'dark',
                                            title:'Atención',
                                            content:res2.msg_response,
                                            buttons:{
                                                confirm:{
                                                    text:'Aceptar',
                                                    action:function(){
                                                        window.location.reload();
                                                    }
                                                }
                                            }
                                        })
                                    }
                                    else{
                                        $.alert({
                                            theme:'dark',
                                            title:'Atención',
                                            content:res2.msg_response
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
                    }
                    else{
                        $.alert({
                            theme:'dark',
                            title:'Atención',
                            content:res.msg_response
                        });
                    }
                }
            });
        }
    });

    $("#btnCancelCompanyInfo").click(function(){
        $("#company_file")[0].files[0].file="";
        $("#company_file").siblings("label").html('Archivo');
        $("#company_file").siblings("label").removeClass("invalid-file-field");
        $("#company_file").siblings("label").removeClass("valid-file-field");
        $("#spncompany_file").addClass("hide-error");
        $("#spncompany_file").removeClass("show-error");
    });

    $("#btnCancelSatInfo").click(function(){
        $("#sat_file")[0].files[0].file="";
        $("#sat_file").siblings("label").html('Archivo');
        $("#sat_file").siblings("label").removeClass("invalid-file-field");
        $("#sat_file").siblings("label").removeClass("valid-file-field");
        $("#spnsat_file").addClass("hide-error");
        $("#spnsat_file").removeClass("show-error");
    });

    $("#openDownloadLoadingFormat").click(function(){
        $.confirm({
            theme:'dark',
            title:'Atención',
            content:'¿Desea descargar el formato para la carga de información?',
            buttons:{
                confirm:{
                    text:'Sí',
                    action:function(){
                        $.ajax({
                            url:'/cfdi/createLoadingFormat',
                            type:'POST',
                            data:JSON.stringify({}),
                            success:function(response){
                                try{
                                    var res=JSON.parse(response);
                                }catch(err){
                                    ajaxError();
                                }
                                if (res.success){
                                    window.open('/cfdi/downloadFile/'+res.filename,"_blank");
                                }
                            },
                            error:function(){
                                $.alert({
                                    theme:'dark',
                                    title:'Atención',
                                    content:'Ocurrió un error, favor de intentarlo más tarde.'
                                });
                            }
                        });
                    }
                },
                cancel:{
                    text:'No'
                }
            }
        });
    });

    $("#btnCDownloadLoadingFormat").click(function(){
        $.confirm({
            theme:'dark',
            title:'Atención',
            content:'¿Desea descargar el formato para la carga de información?',
            buttons:{
                confirm:{
                    text:'Sí',
                    action:function(){
                        $.ajax({
                            url:'/cfdi/createLoadingFormat',
                            type:'POST',
                            data:JSON.stringify({}),
                            success:function(response){
                                try{
                                    var res=JSON.parse(response);
                                }catch(err){
                                    ajaxError();
                                }
                                if (res.success){
                                    window.open('/cfdi/downloadFile/'+res.filename,"_blank");
                                }
                            },
                            error:function(){
                                $.alert({
                                    theme:'dark',
                                    title:'Atención',
                                    content:'Ocurrió un error, favor de intentarlo más tarde.'
                                });
                            }
                        });
                    }
                },
                cancel:{
                    text:'No'
                }
            }
        });
    });

    $("#btnDoComparison").click(function(){
        var data={};
        data['month']=$("#selComparingMonth").find("option:selected").attr("name");
        data['year']=$("#selComparingYears").find("option:selected").attr("name");
        data['company_id']=2;
        $.ajax({
            url:'/cfdi/checkDataToCompare',
            type:'POST',
            data:JSON.stringify(data),
            success:function(response){
                try{
                    var res=JSON.parse(response);
                }catch(err){
                    ajaxError();
                }
                if (res.success){
                    if (res.available){
                        $.alert({
                            theme:'dark',
                            title:'Atención',
                            content:res.msg_response
                        });
                        // $.ajax({
                        //     url:'/cfdi/doComparison',
                        //     type:'POST',
                        //     data:JSON.stringify(data),
                        //     success:function(response2){
                        //         try{
                        //             var res2=JSON.parse(response2);
                        //         }catch(err){
                        //             ajaxError();
                        //         }
                        //         if (res2.success){
                        //             $.alert({
                        //                 theme:'dark',
                        //                 title:'Atención',
                        //                 content:res2.msg_response,
                        //                 buttons:{
                        //                     confirm:{
                        //                         text:'Descargar',
                        //                         action:function(){
                        //
                        //                         }
                        //                     }
                        //                 }
                        //             })
                        //         }
                        //     }
                        // })
                    }
                    else{
                        $.alert({
                            theme:'dark',
                            title:'Atención',
                            content:res.msg_response
                        });
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
    });
});

function getYears(sel_id){
    var current_year=new Date().getFullYear();
    for (var i=2017; i<current_year+1; i++){
        $(sel_id).append($('<option>',{
            text:i,
            name:i
        }));
    }
}
