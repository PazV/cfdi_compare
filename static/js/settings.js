$(document).ready(function(){
    var me = this;
    this.user_info=JSON.parse($("#spnSession")[0].textContent);

    if (window.location.pathname.includes('/settings/companies')){
        // getCompanies(1);
        getCompanies(me.user_info.user_id);
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

        validate=emptyField("#"+this.id,"#spn"+this.id);
    });

    $("#btnSaveCompany").click(function(){
        $("#frmCompany .form-control").focusout();
        if ($("#txtCompanyRfc").hasClass('valid-field') && $("#txtCompanyName").hasClass('valid-field')){
            var frm = getForm("#frmCompany");
            frm['company_id']=$("#win_new_company").data('company_id');

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
                                        // getCompanies(1);
                                        getCompanies(me.user_info.user_id);
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
                    var ids=[];
                    if ($("#win_new_user").data('ids')!=undefined && $("#win_new_user").data('ids')!=''){
                        ids=$("#win_new_user").data('ids').split(",");
                        for (var i in ids){
                            ids[i]=parseInt(ids[i].split("_")[1]);
                        }
                    }
                    for (var x of res.data){
                        var id='comp_'+x['company_id'];
                        if (ids.includes(x['company_id'])){
                            $("#divSelectCompanies").append('<div class="form-check"><input class="form-check-input" type="checkbox" checked="true" id="'+id+'"/><label class="form-check-label" for="'+id+'">'+x['name']+'</label></div>');
                        }
                        else{
                            $("#divSelectCompanies").append('<div class="form-check"><input class="form-check-input" type="checkbox" value="" id="'+id+'"/><label class="form-check-label" for="'+id+'">'+x['name']+'</label></div>');
                        }
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
            $(".div-companies-fieldset").append('<span class="spn-company-fieldset"><i class="far fa-building" data-company=""></i> '+x['labels'][0].textContent+'</span>');
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
        $("#win_new_user").data('ids','');
        $("#win_new_user").data('user_id','');
    });

    $("#win_my_account").on('show.bs.modal',function(){
        $("#txtMAuserName").val(me.user_info.name);
        $("#win_my_account").data('user_id',me.user_info.user_id);
    });

    $("#check_old_password").on('change',function(){
        if ($(this)[0].checked===true){
            $("#txtMAoldPassword").attr("type","text");
        }
        else{
            $("#txtMAoldPassword").attr("type","password");
        }
    });

    $("#check_new_password").on('change',function(){
        if ($(this)[0].checked===true){
            $("#txtMAnewPassword").attr("type","text");
        }
        else{
            $("#txtMAnewPassword").attr("type","password");
        }
    });

    $("#frmMyAccount .form-control").on('focusout',function(){
        validate=emptyField("#"+this.id,"#spn"+this.id);
    });

    $("#btnSaveUserChanges").click(function(){
        $("#frmMyAccount .form-control").focusout();
        var form_input=$("#frmMyAccount .form-control");
        var valid=true;
        for (var x in form_input){
            if ($("#"+form_input[x].id).hasClass('invalid-field')){
                valid=false;
            }
        }
        var data=getForm("#frmMyAccount");
        data['user_id']=$("#win_my_account").data('user_id');
        EasyLoading.show({
            text:'Cargando...',
            type:EasyLoading.TYPE["BALL_SCALE_RIPPLE_MULTIPLE"]
        });
        $.ajax({
            url:'/settings/changeMyAccount',
            type:'POST',
            data:JSON.stringify(data),
            success:function(response){
                try{
                    var res=JSON.parse(response);
                }catch(err){
                    ajaxError();
                }
                EasyLoading.hide();
                if (res.success){
                    $.alert({
                        theme:'dark',
                        title:'Atención',
                        content:res.msg_response,
                        buttons:{
                            confirm:{
                                text:'Aceptar',
                                action:function(){
                                    $("#win_my_account").modal("hide");
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
                EasyLoading.hide();
                $.alert({
                    theme:'dark',
                    title:'Atención',
                    content:'Ocurrió un error, favor de intentarlo de nuevo.'
                });
            }
        });
    });

    $("#btnEditCompany").click(function(){
        var table=$("#grdCompanies").DataTable();
        if (table.rows('.selected').any()){
            var ind=table.row('.selected').index();
            var record=table.rows(ind).data()[0];
            $("#win_new_company").data('company_id',record['company_id']);
            $("#txtCompanyName").val(record['name']);
            $("#txtCompanyRfc").val(record['rfc']);
            $("#win_new_company").modal("show");
        }
        else{
            $.alert({
                theme:'dark',
                title:'Atención',
                content:'Debes seleccionar una empresa para editarla.'
            });
        }
    });

    $("#btnDisableCompany").click(function(){
        var table=$("#grdCompanies").DataTable();
        if (table.rows('.selected').any()){
            var ind=table.row('.selected').index();
            var record=table.rows(ind).data()[0];
            $.confirm({
                theme:'dark',
                title:'Atención',
                content:'¿Está seguro que desea deshabilitar esta empresa?',
                buttons:{
                    confirm:{
                        text:'Sí',
                        action:function(){
                            EasyLoading.show({
                                text:'Cargando...',
                                type:EasyLoading.TYPE["BALL_SCALE_RIPPLE_MULTIPLE"]
                            });
                            $.ajax({
                                url:'/settings/disableCompany',
                                type:'POST',
                                data:JSON.stringify({'company_id':record['company_id']}),
                                success:function(response){
                                    try{
                                        var res=JSON.parse(response);
                                    }catch(err){
                                        ajaxError()
                                    }
                                    EasyLoading.hide();
                                    if (res.success){
                                        $.alert({
                                            theme:'dark',
                                            title:'Atención',
                                            content:res.msg_response,
                                            buttons:{
                                                confirm:{
                                                    text:'Aceptar',
                                                    action:function(){
                                                        getCompanies(me.user_info.user_id);
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
                                    EasyLoading.hide();
                                    $.alert({
                                        theme:'dark',
                                        title:'Atención',
                                        content:'Ocurrió un error, favor de intentarlo de nuevo.'
                                    });
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
            $.alert({
                theme:'dark',
                title:'Atención',
                content:'Debe seleccionar una empresa para deshabilitarla.'
            });
        }
    });

    $("#btnEditUser").click(function(){
        var table=$("#grdUsers").DataTable();
        if (table.rows('.selected').any()){
            var ind=table.row('.selected').index();
            var record=table.rows(ind).data()[0];
            $("#txtUserName").val(record['name']);
            $("#txtUserEmail").val(record['email']);
            $("#win_new_user").data('user_id',record['user_id']);
            console.log(record);
            $.ajax({
                url:'/settings/getUserCompanies',
                type:'POST',
                data:JSON.stringify({'user_id':record['user_id']}),
                success:function(response){
                    try{
                        var res=JSON.parse(response);
                    }catch(err){
                        ajaxError();
                    }
                    if (res.success){
                        $("#win_new_user").modal("show");
                        var check_list=[];
                        for (var x of res.data){
                            $(".div-companies-fieldset").append('<span class="spn-company-fieldset"><i class="far fa-building" data-company=""></i> '+x['name']+'</span>');
                            check_list.push('comp_'+x.company_id);
                        }
                        $("#win_new_user").data('ids',String(check_list));
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
        else{
            $.alert({
                theme:'dark',
                title:'Atención',
                content:'Debe seleccionar un usuario para editarlo.'
            });
        }
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

$.extend( $.fn.dataTable.defaults, {
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
