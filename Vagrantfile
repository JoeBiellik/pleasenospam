$provision = <<-'EOF'
	#!/bin/bash -eu

	echo 'Provisioning environment...'

	if [ -f /vagrant/package.json ]; then
		echo -e "\tRunning 'npm install'..."

		rm -rf /vagrant/node_modules
		su vagrant -c 'mkdir -p /home/vagrant/node_modules'
		su vagrant -c 'ln -s /home/vagrant/node_modules /vagrant/node_modules'

		su vagrant -c "cd /vagrant && npm install --silent > /dev/null 2>&1"
	fi

	echo -e '\nFinished provisioning:\n'
	printf '\tNode v%s' $(node -v | cut -d'v' -f2)
	printf '\tNPM v%s' $(npm -v)
EOF

Vagrant.configure("2") do |config|
	config.vm.define "pleasenospam"
	config.vm.hostname = "pleasenospam"
	config.vm.box = "jcbiellikltd/centos-6-node"
	config.vm.provision :shell, inline: $provision

	config.vm.network :forwarded_port, guest: 3000, host: 3000, auto_correct: true

	config.ssh.insert_key = false

	config.vm.provider "virtualbox" do |v|
		v.name = "pleasenospam"
		v.cpus = 4
		v.memory = 2048
		v.customize ["setextradata", :id, "VBoxInternal2/SharedFoldersEnableSymlinksCreate/v-root", "1"]
	end
end
