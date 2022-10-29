
$(".image").each(function(index){
    let image = $(this).attr("content")
    $(this).css("background-image", "url(/uploads/" + image +")");
    const img = new Image();
    img.onload = function() {
    }
    img.src = "/uploads/" + image;

    $(this).height(img.height);
    if($(this).height() == 0) {
        window.location.reload();
    }
});