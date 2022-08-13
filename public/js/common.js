function ensureOneCheck(checkBoxName, messageId, submitId) {
    const checkBoxes = $('[name=' + checkBoxName + ']');
    let checkCount = 0;
    for (let i = 0; i < checkBoxes.length; i++) {
        if (checkBoxes[i].checked)
            checkCount++;
    }
    if (checkCount === 0) {
        $('#' + messageId).show();
        $('#' + submitId).prop('disabled', true);
        return false;
    } else {
        $('#' + messageId).hide();
        $('#' + submitId).prop('disabled', false);
        return true;
    }
}

function initialiseTitle() {
    let title = $('#title').val();
    let titleArr = [];
    let initTitle = '';
    if (title) {
        titleArr = title.trim().split(' ');
        for (let i = 0; i < titleArr.length; i++) {
            initTitle += titleArr[i].charAt(0).toUpperCase() + titleArr[i].slice(1)
                + (i == titleArr.length - 1 ? '' : ' ');
        }
        $('#title').val(initTitle);
    }
}

// Display selected file name
$(".custom-file-input").on("change", function () {
    var fileName = $(this).val().split("\\").pop();
    $(this).siblings(".custom-file-label").addClass("selected").html(fileName);
});

// Use fetch to call post route /menu/upload
$('#posterUpload').on('change', function () {
    let formdata = new FormData();
    let image = $("#posterUpload")[0].files[0];
    formdata.append('posterUpload', image);
    fetch('/admin/upload',{
        method: 'POST',
        body: formdata
    })
    fetch('/user/upload',{
        method: 'POST',
        body: formdata
    })
    
        .then(res => res.json())
        .then((data) => {
            $('#poster').attr('src', data.file);
            $('#posterURL').attr('value', data.file); // sets posterURL hidden field
            if (data.err) {
                $('#posterErr').show();
                $('#posterErr').text(data.err.message);
            }
            else {
                $('#posterErr').hide();
            }
        })
});

let btn = document.querySelector("#btn");
let sidebar = document.querySelector(".sidebar")
let searchBtn = document.querySelector(".bx-search")

btn.onclick = function() {
    sidebar.classList.toggle("active");
}

searchBtn.onclick = function() {
    sidebar.classList.toggle("active");
}


$('.owl-carousel').owlCarousel({
    loop: true,
    margin: 10,
    nav: true,
    responsive: {
        0: {
            items: 1
        },
        600: {
            items: 3
        },
        1000: {
            items: 3
        }
    }
})