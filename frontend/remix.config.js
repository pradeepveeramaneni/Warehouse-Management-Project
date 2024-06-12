const {flatRoutes} = require("remix-flat-routes")

/**
 * @type {import('@remix-run/dev').AppConfig}
 */
module.exports = {
	// When running locally in development mode, we use the built in remix
	// server. This does not understand the vercel lambda module format,
	// so we default back to the standard build output.
	ignoredRouteFiles: ["**/*"],
	serverModuleFormat: "cjs",
	postcss: true,
	tailwind: true,
	routes: async (defineRoutes) => {
		return flatRoutes("routes", defineRoutes)
	},
	// appDirectory: "app",
	// assetsBuildDirectory: "public/build",
	// serverBuildPath: "api/index.js",
	// publicPath: "/build/",
}
