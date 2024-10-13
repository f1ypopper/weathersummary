function handleNotificationSend(){
    const messageTitle = document.getElementById("notification-title").value;
    const messageBody = document.getElementById("notification-body").value;

    const toast = bootstrap.Toast.getOrCreateInstance(document.getElementById('liveToast'));
    document.getElementById("toast-notification-title").innerText = messageTitle;
    document.getElementById("toast-notification-body").innerText = messageBody;
    toast.show();
}

export function initNotificationMode(){
    document.getElementById("notification-send-btn").addEventListener("click", handleNotificationSend);
}