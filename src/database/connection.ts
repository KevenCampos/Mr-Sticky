import { connect } from "mongoose";

export default async () => {
    await connect(process.env.MONGODB_CONNECTION!).then(() => {
        console.log("✅・Conexão com o MongoDB estabelecida com sucesso!");
    })
}

