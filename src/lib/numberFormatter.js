export default function formatNumber(number){
    let numberString = number.toFixed()

    if(number >= 1000 && number < 10000){
        return `${numberString[0]}.${numberString[1]}k`
    } else if(number >= 10000 && number < 100000){
        return `${numberString[0]}${numberString[1]}.${numberString[2]}k`
    }else if (number >=100000 && number < 1000000){
     return `${numberString[0]}${numberString[1]}${numberString[2]}.${numberString[3]}k`   
    }else if(number >=100000 && number < 10000000){
        return `${numberString[0]}.${numberString[1]}M`
    }
    return numberString
}