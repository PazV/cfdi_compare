$(document).ready(function(){
    var me = this;

    if (window.location.pathname.includes('/settings/companies')){
        getCompanies(1);
    }

    if (window.location.pathname.includes('/settings/users')){
        loadUsersTable();
    }

    $("#btnAddCompany").click(function(){
        $("#win_new_company").data('company_id',-1);
        $("#win_new_company").modal("show");
    });

    $("#btnAddUser").click(function(){
        $("#win_new_user").data('user_id',-1);
        $("#win_new_user").modal("show");
    });

    $("#frmCompany .form-control").focusout(function(){
        console.log(this.id);
        validate=emptyField("#"+this.id,"#spn"+this.id);
    });

    $("#btnSaveCompany").click(function(){
        $("#frmCompany .form-control").focusout();
        if ($("#txtCompanyRfc").hasClass('valid-field') && $("#txtCompanyName").hasClass('valid-field')){
            var frm = getForm("#frmCompany");
            frm['company_id']=$("#win_new_company").data('company_id');
            console.log(frm);
            $.ajax({
                url:'/settings/saveCompany',
                type:'POST',
                data:JSON.stringify(frm),
                success:function(response){
                    try{
                        var res=JSON.parse(response);
                    }catch(err){
                        ajaxError();
                    }
                    if (res.success){
                        $.confirm({
                            theme:'dark',
                            title:'Atención',
                            content:res.msg_response,
                            buttons:{
                                confirm:{
                                    text:'Aceptar',
                                    action:function(){
                                        getCompanies(1);
                                        $("#win_new_company").modal("hide");
                                    }
                                }
                            }
                        });
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
    });

    $("#win_new_company").on('hidden.bs.modal',function(){
        resetForm("#frmCompany",["input|INPUT"]);
    });

    $("#btnOpenSelectCompanies").click(function(){
        $.ajax({
            url:'/settings/getAllCompanies',
            type:'POST',
            data:JSON.stringify({'user_id':1}),
            success:function(response){
                try{
                    var res=JSON.parse(response);
                }catch(err){
                    ajaxError();
                }
                if (res.success){
                    for (var x of res.data){
                        var id='comp_'+x['company_id'];
                        $("#divSelectCompanies").append('<div class="form-check"><input class="form-check-input" type="checkbox" value="" id="'+id+'"/><label class="form-check-label" for="'+id+'">'+x['name']+'</label></div>');
                    }
                }
            }
        })
        $("#win_select_user_companies").modal("show");
    });

    $("#frmUser .form-control").focusout(function(){
        validate=emptyField("#"+this.id,"#spn"+this.id);
        if (validate===true && this.id=='txtUserEmail'){
            validateMail("#txtUserEmail","#spntxtUserEmail");
        }
    });

    $("#btnSaveUser").click(function(){
        $("#frmUser .form-control").focusout();
        if ($("#txtUserName").hasClass('valid-field') && $("#txtUserEmail")){
            var frm = getForm("#frmUser");
            frm['user_id']=$("#win_new_user").data('user_id');
            if ($("#win_new_user").data('ids')==undefined){
                frm['companies']=''
            }
            else{
                frm['companies']=$("#win_new_user").data('ids');
            }
            console.log(frm);
            $.ajax({
                url:'/settings/saveUser',
                type:'POST',
                data:JSON.stringify(frm),
                success:function(response){
                    try{
                        var res=JSON.parse(response);
                    }catch(err){
                        ajaxError();
                    }
                    if (res.success){
                        loadUsersTable();
                        $("#win_new_user").modal("hide");
                    }else{
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
                        content:'Ocurrió un erorr, favor de intentarlo de nuevo.'
                    });
                }
            });
        }
    });

    $("#win_select_user_companies").on('hide.bs.modal',function(){
        $("#divSelectCompanies").empty();
    });

    $("#btnSaveSelectedCompanies").click(function(){
        $(".div-companies-fieldset").empty();
        var checks = $("#frmSelectCompanies").find("input[type=checkbox]:checked");
        var check_list=[];
        for (var x of checks){
            console.log(x);
            $(".div-companies-fieldset").append('<span class="spn-company-fieldset"><i class="far fa-building"></i> '+x['labels'][0].textContent+'</span>');
            check_list.push(x.id);
        }
        $("#win_new_user").data('ids',String(check_list));
        $("#win_select_user_companies").modal("hide");
    });

    $("#win_new_user").on('show.bs.modal',function(){
        $(".div-companies-fieldset").empty();
    });

    $("#win_new_user").on('hide.bs.modal',function(){
        resetForm("#frmUser",["input|INPUT"]);
        $(".div-companies-fieldset").empty();
    })



    $.extend($.fn.dataTable.defaults, {
        "autoWidth":true,
        "searching":false,
        "responsive":true,
        "ordering":false,
        "destroy":true,
        "select":{
            "style":"single",
        },
        "lengthMenu": [ 5, 10, 15, 20, 25 ],
        "language":{
            "decimal":        ".",
            "emptyTable":     "No hay información disponible",
            "info":           "Mostrando _START_ a _END_ de _TOTAL_ registros",
            "infoEmpty":      "Mostrando 0 a 0 de 0 registros",
            "infoFiltered":   "(filtrado de _MAX_ total registros)",
            "infoPostFix":    "",
            "thousands":      ",",
            "lengthMenu":     "Mostrar _MENU_ registros",
            "loadingRecords": "Cargando...",
            "processing":     "Procesando...",
            "search":         "Buscar:",
            "zeroRecords":    "No se encontraron registros",
            "paginate": {
                "first":      "Primero",
                "last":       "Última",
                "next":       "Siguiente",
                "previous":   "Anterior"
            },
            "aria": {
                "sortAscending":  ": activar para ordenar de forma ascendente",
                "sortDescending": ": activar para ordenar de forma descendente"
            },
            "select":{
                "rows":""
            }
        },
    });

});

function getCompanies(user_id){
    $("#grdCompanies").DataTable({
        "scrollY":"225px",
        "scrollCollapse":true,
        "lengthChange":false,
        serverSide:true,
        destroy:true,
        ajax:{
            data:{'user_id':user_id},
            url:'/settings/getCompanies',
            dataSrc:'data',
            type:'POST',
            error:ajaxError,
        },
        columns:[
            {data:'name',"width":"40%"},
            {data:'rfc',"width":"30%"},
            {data:'created',"width":"30%"}
        ]
    });
}

function loadUsersTable(){
    $("#grdUsers").DataTable({
        "scrollY":"225px",
        "scrollCollapse":true,
        "lengthChange":false,
        serverSide:true,
        destroy:true,
        ajax:{
            data:{},
            url:'/settings/getUsers',
            dataSrc:'data',
            type:'POST',
            error:ajaxError,
        },
        columns:[
            {data:'name',"width":"50%"},
            {data:'email',"width":"50%"}
        ]
    });
}
