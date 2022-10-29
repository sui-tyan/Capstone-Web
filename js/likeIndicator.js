
$(".like-button").each(function(index){
    let likedBy = $(this).attr("likedBy");
    let liked = $(this).attr("liked");
    let length = $(this).attr("length");
    for(let i = 0; i < length; i++){
        const idArray = likedBy.split(",");
        if(liked == idArray[i]) {
            $(this).addClass("liked-button");
            console.log("liked");
            console.log(likedBy + " = " + liked);
        } else {
            console.log("not equal");
        }
    }
    // if(likedBy == liked) {
    //     $(this).addClass("liked-button");
    //     console.log("liked");
    //     console.log(likedBy + " = " + liked);
    // } else {
    //     console.log("not liked");
    //     console.log(likedBy + " = " + liked);
    // }
});