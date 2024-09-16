'use server'
import { prisma } from "@/utils/prisma";
export const getUserData = async ( id : string ) => {


    try{

        const user = await prisma.user.findFirst({
            where  : { id : id },
            select : {
                image : true,
                username : true,
                email : true,
                name : true,
                rating : true
            }
        })

        return JSON.parse(JSON.stringify(user));

    }catch(error) { 
        console.log(error);
    }
}