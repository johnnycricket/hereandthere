export default function clockService(offset = 0) {
    let time = new Date(),
        h = time.getUTCHours(),
        m = time.getUTCMinutes(),
        formatted_h = "",
        formatted_m = "",
        nightday = "";

    h = notover24(h, offset)

    nightday = amPm(h)

    h = twelvehourclock(h)

    formatted_h = addzero(h)
    formatted_m = addzero(m)

    return formatted_h + ":" + formatted_m + ' ' + nightday;
}

function amPm(hour) {
    return hour < 12 ? "am" : "pm";
}

function twelvehourclock(hour) {
    return hour > 12 ? hour - 12 : hour;
}

function notover24(hour, offset) {
    if(hour + offset > 24) {
        hour = hour + offset - 24;
    } else if(hour + offset < 0) {
        hour = hour + offset + 24;
    } else{
        hour = hour + offset;
    }
    return hour;
}

function addzero(time){
    return time < 10 ? `0${time}`: `${time}`
}