let postId;
function liked(postid) {
    console.log("Clicked");
    $(".like-button").each(function(index){
        postId = $(this).attr("postId");
        if(postid !== postId) {
            console.log("Redirected");
            $(postId).removeClass("liked-button");
        } 
        else if(postid === postId) {
            console.log(postid);
            $.post('/' + postId, function(response){
                $('.'+ postid +'').text(response.likeCount);
                $("."+postid+"button").addClass("liked-button");
            });
            $(postId).addClass("liked-button");
        } else {
            
        }

    });
}