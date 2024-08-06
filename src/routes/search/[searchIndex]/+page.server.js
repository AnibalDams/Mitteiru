
export function load({params,cookies}){

    const searchIndex = params.searchIndex
     
    const userId = cookies.get("userId")
    return {searchIndex,userId}
}