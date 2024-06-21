export type SmellKubernetes = {
	workload_position: number
	message: string
	suggestion: string
}

export type Meta = {
	totalOfSmells: number
}

export type Data = {
	smellsReplicaSet: SmellKubernetes[]
	smellsDeployment: SmellKubernetes[]
	smellsPod: SmellKubernetes[]
	smellsJob: SmellKubernetes[]
	smellsCronJob: SmellKubernetes[]
	smellsStatefulSet: SmellKubernetes[]
	smellDemonSet: SmellKubernetes[]
}

export type Response = {
	meta: Meta
	data: Data
}

export type RequestError = {
	message: string
}
