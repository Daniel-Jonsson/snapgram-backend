### Ubuntu Express Server Setup

#### Install Ubuntu Server
This is done following petebe's guide.
device: snapgram
user: snapgram
password: katten123

When at terminal:
```bash
# Refresh apt-get package index
sudo apt-get update
sudo apt-get upgrade -y
sudo snap install --classic code

# SSH..
sudo apt-get update
sudo apt-get install -y openssh-server

# Copy over public SSH key from windows machine (this is from shared volume)
sudo mount -t vboxsf shared /mnt
cp /mnt/id_rsa.pub ~/.ssh/id_rsa.pub
cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys # Append key here
# Check permissions
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys

# Install "Remote - SSH Extension" in VSCode on windows
# In VSCode: Press F1 -> "remote-ssh: connect to host..." -> enter -> [linuxUsername]@[linuxIPaddr] -> enter -> ...profit

# The rest of the steps can now be done from terminal in VSCode

# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash

# Load nvm
export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Verify nvm installation
nvm --version

# Install latest LTS version of Node.js
nvm install --lts

# Use the installed LTS version and set it as default
nvm use --lts
nvm alias default 'lts/*'

# Verify Node.js and npm versions
node -v
npm -v


# Setup SSH for bitbucket (on linux machine)
ssh-keygen -t ed25519 -b 4096 -C "heos2200@student.miun.se" -f bitbucket

# Start ssh-agent (in case its not running)
eval $(ssh-agent)

# Add private key, the file is named "bitbucket" here
ssh-add ~/bitbucket

# Go to settings on bitbucket and add "bitbucket.pub"
# Pull front-end and enter directory
npm install
npm run build # Fix any errors here.. And dont forget to update connection string in apiService.tsx

# Move contents of dist folder to express static route folder after its setup
npm install
npm start # Server running and every1 is happy.. not

# Try setup https CA cert

openssl req -nodes -new -x509 -keyout server.key -out server.cert
# landcode: SE, company/name: snapgram, org: miun

# copy to shared folder
cp server.cert /mnt/

# Add both server.cert and server.key to some folder under backends 'dist' folder. Configure https to use this
// Create an HTTPS server
const privateKeyPath = "/home/snapgram/test/dt167_project_backend/dist/sec/server.key";
const certificatePath = "/home/snapgram/test/dt167_project_backend/dist/sec/server.cert";
const options = {
    key: fs.readFileSync(privateKeyPath),
    cert: fs.readFileSync(certificatePath),
  };
  
https.createServer(options, app).listen(8005);

# Redirect from http..
```

