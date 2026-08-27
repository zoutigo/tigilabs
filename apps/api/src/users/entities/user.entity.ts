export class UserEntity {
  id!: string;
  email!: string;
  name!: string;
  status!: "ACTIVE" | "INVITED" | "DISABLED";
  createdAt!: Date;
  updatedAt!: Date;
}
