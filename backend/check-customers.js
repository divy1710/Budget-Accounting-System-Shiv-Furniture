const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCustomers() {
  try {
    // Get all customers
    const customers = await prisma.contact.findMany({
      where: { type: 'CUSTOMER' }
    });
    
    console.log('=== CUSTOMERS IN DATABASE ===');
    if (customers.length === 0) {
      console.log('No customers found!');
    } else {
      customers.forEach(c => {
        console.log(`- ${c.name} (ID: ${c.id}) | Portal: ${c.isPortalUser ? 'YES' : 'NO'}`);
      });
    }
    
    // Check if johndoe exists by name
    const johndoe = await prisma.contact.findFirst({
      where: { 
        name: { contains: 'john', mode: 'insensitive' }
      }
    });
    
    console.log('\n=== JOHNDOE CHECK ===');
    if (johndoe) {
      console.log('Found:', JSON.stringify(johndoe, null, 2));
      if (johndoe.type !== 'CUSTOMER') {
        console.log('WARNING: johndoe exists but is NOT a CUSTOMER (type:', johndoe.type, ')');
      }
    } else {
      console.log('johndoe NOT found in database. Creating now...');
      
      // Create johndoe as a customer
      const newCustomer = await prisma.contact.create({
        data: {
          name: 'John Doe',
          type: 'CUSTOMER',
          email: 'johndoe@example.com',
          phone: '9876543210',
          street: '123 Main Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          isPortalUser: true,
          portalPassword: 'johndoe123'
        }
      });
      console.log('Created new customer:', JSON.stringify(newCustomer, null, 2));
      console.log('\n*** John Doe can now login to Customer Portal with: ***');
      console.log('Email: johndoe@example.com');
      console.log('Password: johndoe123');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCustomers();
