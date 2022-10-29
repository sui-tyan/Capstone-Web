$(".image-profile").each(function(index){
    let image = $(this).attr("content")
    $(this).css("background-image", "url(/uploads/" + image +")");
});