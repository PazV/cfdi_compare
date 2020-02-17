$(document).ready(function(){
    var me = this;
    $("#btnAddCompany").click(function(){
        $("#win_new_company").modal("show");
    });

    $("#btnAddUser").click(function(){
        $("#win_new_user").modal("show");
    });
});
