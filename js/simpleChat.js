

// function asyncGetNextUtterance(message) {
//     return new Promise((resolved, rejected) => {
//         if (message.toLowerCase().includes('joke')) {
//             // Send the response to the API endpoint. read more about this ajax call here https://api.jquery.com/jquery.ajax/
//                 $.ajax({
//                     url: "https://icanhazdadjoke.com/", //
//                     type: 'GET',
//                     headers: {
//                         'Accept': 'application/json'
//                     },
//                     success: function (data) {
//                         resolved(data);
//                     },
//                     error: function (error) {
//                         rejected(error);
//                     }
//                 });

//         } else {
//             // Send the response to the API endpoint. read more about this ajax call here https://api.jquery.com/jquery.ajax/
//                 $.ajax({
//                     url: "https://uselessfacts.jsph.pl/random.json?language=en", //
//                     type: 'GET',
//                     success: function (data) {
//                         resolved(data);
//                     },
//                     error: function (error) {
//                         rejected(error);
//                     }
//                 });
//         }

//     }
//     )
// }



function asyncGetNextUtterance(params) {
    return new Promise((resolved, rejected) => {
        var lexruntime = new AWS.LexRuntime();
        lexruntime.postText(params, function (err, data) {
            if (err) {
                console.log(err, err.stack);
                rejected('Error:  ' + err.message + ' (see console for details)', 'lexError', 'conversation1')
            }
            else {
                resolved(data);
            }

            // if (data && input!=endConversationStatement) {
            //     // Capture the sessionAttributes for the next cycle
            //     sessionAttributes = data.sessionAttributes;

            // }
        });
    })
}
//Helper function to format date time
function getFormattedDate() {
    function formatAMPM(date) {
        var hours = date.getHours();
        var minutes = date.getMinutes();
        var ampm = hours >= 12 ? 'pm' : 'am';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        minutes = minutes < 10 ? '0' + minutes : minutes;
        var strTime = hours + ':' + minutes + ' ' + ampm;
        return strTime;
    }
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    var d = new Date();
    currentDateTime = monthNames[d.getMonth()] + " " + d.getDate() + " " + formatAMPM(d)
    return currentDateTime
}


// Any time this method is called will display the passed message on the left hand side of the chat window
function displayLeftMessage(message) {
    currentDateTime = getFormattedDate(); // get current date time
    // create a declartive string that can be parsed into and HTML object by jQuery. The message is inserted into place in the HTML
    str = "<div class='direct-chat-msg'><div class='direct-chat-info clearfix'><span class='direct-chat-name pull-left'>Agent</span><span class='direct-chat-timestamp pull-right'>" + currentDateTime + "</span></div><img class='direct-chat-img' src='/img/administrator-male.png' alt='message user image'><div class='direct-chat-text'>" + message + "</div></div>";
    html = $.parseHTML(str);
    //console.log(html);
    $(".direct-chat-messages").append(html);
}

// Any time this method is called will display the passed message in chat window
function displayRightMessage(message) {
    currentDateTime = getFormattedDate(); // get current date time
    // create a declartive string that can be parsed into and HTML object by jQuery. The message is inserted into place in the HTML
    str = "<div class='direct-chat-msg right'><div class='direct-chat-info clearfix'> <span class='direct-chat-name pull-right'>Customer</span> <span class='direct-chat-timestamp pull-left'>" + currentDateTime + "</span> </div> <img class='direct-chat-img' src='/img/person-female.png' alt='message user image'> <div class='direct-chat-text'>" + message + "</div> </div>";
    html = $.parseHTML(str);
    //console.log(html);
    $(".direct-chat-messages").append(html);
}


// This helper function is used when the promise is fulfilled.
function onFulFilled(data) {
    //for each fulfilled promise, we are going to append the returned text to the chat by calling the function to append the html
    console.log('Response recieved from Lex')
    //console.log(data)
    displayLeftMessage(data.message);

}

// This helper functions is used when the promise is rejected.
function onRejected(error) {
    displayLeftMessage('An error has occured. Please try again later.');
    console.log(JSON.stringify(error));
}

async function makeAjaxCall(params) {
    // store the message in the chat text box
    message = $("input[type=text][name=message]").val();
    // clear the message in the chat text box
    $("input[type=text][name=message]").val('');
    console.log(message);
    //we are now in posession of the message. Apeend the message HTML and the message to the chat window.
    displayRightMessage(message)
    params.inputText = message;
    // It is now time to make our API calls.
    try {
        const data = await asyncGetNextUtterance(params)
        onFulFilled(data)
    } catch (error) {
        onRejected(error);
    }

    // scroll to the bottom of the message div
    $(".direct-chat-messages").animate({ scrollTop: $('.direct-chat-messages').prop("scrollHeight") }, 1000);
}
// Find sample code here https://github.com/awsdocs/amazon-lex-developer-guide/blob/master/example_apps/agent_assistance_bot/index.html
jQuery(function() {
    // Initialize the Amazon Cognito credentials provider
    // Provide the region of your AWS account below
    AWS.config.region = 'us-east-1'; // Region
    AWS.config.credentials = new AWS.CognitoIdentityCredentials({
        // Provide your Pool Id below
        IdentityPoolId: 'us-east-1:44a1759a-a1c8-4db1-b11a-05ed1557e74f',
    });
    var lexUserId = 'chatbot-demo' + Date.now();
    var sessionAttributes = {};
    var my_params = {
        botAlias: 'dev',
        botName: 'JokesandFactsBot',
        userId: lexUserId,
        sessionAttributes: sessionAttributes
    };
    console.log("ready!");
    // The first message is displayed to the user
    displayLeftMessage('Welcome to chat. You can say tell me a joke or tell me a fact');
    // pressing enter button will cause the message to be submitted.
    $("input[type=text][name=message]").on('keyup',function (event) {
        if (event.which === 13) {
            makeAjaxCall(my_params);
        }
    });
    // bind a click even to the sene message button that will take the value of the text
    $("#sendButton").on("click", function () {
        makeAjaxCall(my_params);
    });
});