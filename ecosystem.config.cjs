module.exports = {
	apps: [
		{
			name: 'majalengka-tech',
			port: 3000,
			instances: 1, // atau 'max' jika VPS memiliki multi-core vCPU
			exec_mode: 'fork',
			script: './.output/server/index.mjs',
			env: {
				NODE_ENV: 'production',
				PORT: 3000
			}
		}
	]
}
