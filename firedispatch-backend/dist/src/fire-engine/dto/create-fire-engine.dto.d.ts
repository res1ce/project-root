import { VehicleType, VehicleStatus } from '@prisma/client';
export declare class CreateFireEngineDto {
    model: string;
    type: VehicleType;
    fireStationId: number;
    status?: VehicleStatus;
}
