from app.models.users import User
    
def find(self):
    self.write('user.find')
    self.finish()

def find_one(self, id):
    self.write('user.find_one')
    self.finish()

def create(self):
    self.write('user.create')

def update(self, id):
    self.write('user.udpate')

def destroy(self, id):
    self.write('user.destroy')