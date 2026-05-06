import { GeneratedType } from "@cosmjs/proto-signing";
import { MsgUpdateParams } from "./types/sawtak/poa/v1/tx";
import { MsgUpdateAdmin } from "./types/sawtak/poa/v1/tx";
import { MsgUpdateAllowedValidators } from "./types/sawtak/poa/v1/tx";

const msgTypes: Array<[string, GeneratedType]>  = [
    ["/sawtak.poa.v1.MsgUpdateParams", MsgUpdateParams],
    ["/sawtak.poa.v1.MsgUpdateAdmin", MsgUpdateAdmin],
    ["/sawtak.poa.v1.MsgUpdateAllowedValidators", MsgUpdateAllowedValidators],
    
];

export { msgTypes }