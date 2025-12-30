import {differenceInDays} from "date-fns"

export default class DaysAgo{
    static get(date){
        let today = new Date()

        let difference = differenceInDays(today,new Date(date))
        return {text:difference ==1?"Yesterday":`${difference} days ago`,value:difference}
    


    }
}