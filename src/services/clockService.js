export default function clockService(offset = 0) {
    let time = new Date(),
        h = time.getUTCHours(),
        m = time.getUTCMinutes(),
        formatted_h = "",
        formatted_m = "";

        if(h + offset > 24) {
            h = h + offset - 24;
        } else if(h + offset < 0) {
            h = h + offset + 24;
        } else{
            h = h + offset;
        }

        formatted_h = `${h}`;
        formatted_m = `${m}`;

        if(h < 10){
            formatted_h = `0${h}`;
        }
        if(m < 10){
            formatted_m = `0${m}`;
        }

    return formatted_h + ":" + formatted_m;
}