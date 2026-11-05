import { StatusCodes } from "http-status-codes";
import Service from "../db/models/service.js";

export const listof_Services = async (req, res) => {
  try {
    const services = await Service.find({
      userId: req.user?.id?.userId,
      isDeleted: { $ne: true },
    }).sort({createdAt:-1});
    return res.status(StatusCodes.OK).json(services);
  } catch (error) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: error.message,
      success: false,
    });
  }
};

export const create_services = async (req, res) => {
  try {
    const { name, duration, price, description, icon } = req.body;
    const numericDuration = Number(duration);
    const numericPrice = price === undefined ? 0 : Number(price);
    if (!name?.trim() || !Number.isFinite(numericDuration) || numericDuration < 5 ||
        !Number.isFinite(numericPrice) || numericPrice < 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "Enter a service name, a duration of at least 5 minutes, and a non-negative price",
      });
    }
     
    const service = await Service.create({
      userId: req.user?.id?.userId,
      name,
      duration: numericDuration,
      price: numericPrice,
      description: description || "",
      icon: icon || "C1.png",
    });
    return res.status(StatusCodes.CREATED).json({
        success:true,
        message:"Service is created succesfully",
        service,

    });
  } catch (error) {
     return res.status(StatusCodes.BAD_REQUEST).json({
        message: "Service is not creted!!",
      });
  }
};



export const updateService = async (req, res) => {
  try {
    const updates = {};
    const allowedFields = ['name', 'duration', 'price', 'description', 'isActive', 'icon'];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (updates.name !== undefined && !String(updates.name).trim()) {
      return res.status(400).json({ message: "Service name cannot be empty" });
    }
    if (updates.duration !== undefined && (!Number.isFinite(Number(updates.duration)) || Number(updates.duration) < 5)) {
      return res.status(400).json({ message: "Service duration must be at least 5 minutes" });
    }
    if (updates.price !== undefined && (!Number.isFinite(Number(updates.price)) || Number(updates.price) < 0)) {
      return res.status(400).json({ message: "Service price must be a non-negative number" });
    }
    if (updates.isActive !== undefined && typeof updates.isActive !== "boolean") {
      return res.status(400).json({ message: "Service visibility must be true or false" });
    }
    if (updates.duration !== undefined) updates.duration = Number(updates.duration);
    if (updates.price !== undefined) updates.price = Number(updates.price);
    if (updates.name !== undefined) updates.name = String(updates.name).trim();

    const service = await Service.findOneAndUpdate(
      { _id: req.params.id, userId: req.user?.id?.userId, isDeleted: { $ne: true } },
      updates,
      { new: true }
    );

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    res.json({ message: 'Service updated', service });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteService = async (req , res)=>{
try {
    const service = await Service.findOneAndUpdate(
     
        {_id:req.params.id,userId:req.user?.id?.userId,isDeleted:{$ne:true}},
        {isDeleted:true,isActive:false},
        {new:true}
    ); 
    if(!service){
        return res
        .status(StatusCodes.BAD_REQUEST)
        .json({message:"Service is not exist!!"})
    };
    return res.json({ message: "Service deleted", service });

} catch (error) {
     return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: "Could not delete service",
      });
  }
}

