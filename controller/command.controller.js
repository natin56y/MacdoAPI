const models = require('../models');
const Command = models.Command;

const UserController = require('./auth.controller');
const MenuController = require('./menu.controller');
const ProductsController = require('./product.controller');
const IngredientController = require('./ingredients.controller');
const AccessoryController = require('./accessory.controller');
const SupplementController = require('./supplement.controller');


class CommandController {
    
  /**
   *
   * @param customer
   * @param products
   * @param menus
   * @return {Promise<Command>}
  */
 static async add(customer,products,menus) {
         let price = 0;
         let res;

         for (const menu_id of menus) {
            res = await MenuController.getById(menu_id);
            price += res.price;
         }

        for (const product_id of products) {
            res = await ProductsController.getProductById(product_id, false);
            price += res.price  - (res.price * (res.promoPourcentage / 100));
        }
      let command = new Command({
          customer,
          products,
          menus,
          staff: null,
          isValid: false,
          price
      });
      if(customer === ""){
        command = new Command({
            customer: null,
            products,
            menus,
            staff: null,
            isValid: false,
            price
        });
      }
   
        await command.save();
        return command;
    }


    /**
     *
     * @return {Promise<Command[]>}
     */
    static async getAll() {
        const commands = await Command.find().populate('user').populate('products').populate('menus');
        return commands;
    }

    /**
     *
     * @param id
     * @return {Promise<Command>}
     */
    static async getById(id) {
        const command = await Command.findOne({_id: id}).populate('user').populate('products').populate('menus');
        return command;
    }

    /**
     *
     * @param id
     * @return {Promise<boolean>}
     */
    static async validateCommand(id) {
        const command = await Command.findOne({_id: id}).populate('products').populate('menus').populate('ingredients').populate('accessories').populate('supplements');
        if(command.isValid || command.staff === null){
            return false;
        }

        this.removeStockFromCommand(command);

        const res = await Command.updateOne({_id: id}, {isValid: true});
        if(res.nModified === 1) {
            return true;
        }
        return false;
    }

    static async isStaffOfCommand(commandId,staffId){
        const command = await Command.findOne({_id: commandId});
        if(command){
            return command.staff === staffId
        }else{
            return false
        }
    }

    /**
     *
     * @param command
     * @return {Promise<void>}
     */
    static async removeStockFromCommand(command) {
        const ingredientsRemove = [];
        const accessoriesRemove = [];
        const supplementsRemove = [];

        let products = command.products;

        const menus = command.menus;
        for (const menu of menus) {
            for (const product of menu.products) {
                products.push(await ProductsController.getProductById(product,false));
            }
            for (const accessory of menu.accessories) {
                accessoriesRemove.push(accessory._id);
            }
            for (const supplement of menu.supplements) {
                supplementsRemove.push(supplement._id);
            }
        }

        products.forEach(product => {
            product.ingredients.forEach(ingredient => {
                ingredientsRemove.push(ingredient._id);
            })
            product.accessories.forEach(accessory => {
                accessoriesRemove.push(accessory._id);
            })
            product.supplements.forEach(supplement => {
                supplementsRemove.push(supplement._id);
            })
        });

        ingredientsRemove.forEach(ingredient => {
            IngredientController.updateRealtiveIngredientCount(ingredient,-1);
        });
        accessoriesRemove.forEach(accessory => {
            AccessoryController.updateRealtiveCount(accessory, -1);
        });
        supplementsRemove.forEach(supplement => {
            SupplementController.updateRealtiveCount(supplement,-1);
        });
    }

    static async getAllNoStaff(){
        const commands = await Command.find({staff: null, isValid: false}).populate('products').populate('menus');
        return commands;
    }


    /**
     *
     * @param id
     * @param staff_id
     * @return {Promise<boolean>}
     */
    static async assignPreparator(id, staff_id) {
        const staff = await UserController.getUserById(staff_id);

        if (staff.isStaff) {
            const res = await Command.updateOne({_id: id}, {staff: staff._id});

            if (res.nModified === 1) {
                return true;
            }else{
                return false;
            }
        }else{
            return false;
        }
    }

    static async getCommandNotValidatedOfStaff(staffId){
        return await Command.find({staff: staffId, isValid: false});
    }

    static async getCommandValidatedOfStaff(staffId){
        return await Command.find({staff: staffId, isValid: true});
    }

    static async getHistory(customerId){
        const commands = await Command.find({customer : customerId});
        return commands;
    }
}

module.exports = CommandController;
