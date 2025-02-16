function createURI(s) {
  let service = Cc["@mozilla.org/network/io-service;1"]
                .getService(Ci.nsIIOService);
  return service.newURI(s);
}
 
function run_test() {
  // Set up a profile.
  do_get_profile();

  var secMan = Cc["@mozilla.org/scriptsecuritymanager;1"].getService(Ci.nsIScriptSecurityManager);
  const kURI1 = "http://example.com";
  var app1 = secMan.createCodebasePrincipal(createURI(kURI1), {appId: 1});
  var app10 = secMan.createCodebasePrincipal(createURI(kURI1),{appId: 10});
  var app1browser = secMan.createCodebasePrincipal(createURI(kURI1), {appId: 1, inIsolatedMozBrowser: true});

  var am = Cc["@mozilla.org/network/http-auth-manager;1"].
           getService(Ci.nsIHttpAuthManager);
  am.setAuthIdentity("http", "a.example.com", -1, "basic", "realm", "", "example.com", "user", "pass", false, app1);
  am.setAuthIdentity("http", "a.example.com", -1, "basic", "realm", "", "example.com", "user3", "pass3", false, app1browser);
  am.setAuthIdentity("http", "a.example.com", -1, "basic", "realm", "", "example.com", "user2", "pass2", false, app10);

  Services.clearData.deleteDataFromOriginAttributesPattern({ appId:1, inIsolatedMozBrowser:true });
  
  var domain = {value: ""}, user = {value: ""}, pass = {value: ""};
  try {
    am.getAuthIdentity("http", "a.example.com", -1, "basic", "realm", "", domain, user, pass, false, app1browser);
    Assert.equal(false, true); // no identity should be present
  } catch (x) {
    Assert.equal(domain.value, "");
    Assert.equal(user.value, "");
    Assert.equal(pass.value, "");
  }

  am.getAuthIdentity("http", "a.example.com", -1, "basic", "realm", "", domain, user, pass, false, app1);
  Assert.equal(domain.value, "example.com");
  Assert.equal(user.value, "user");
  Assert.equal(pass.value, "pass");


  am.getAuthIdentity("http", "a.example.com", -1, "basic", "realm", "", domain, user, pass, false, app10);
  Assert.equal(domain.value, "example.com");
  Assert.equal(user.value, "user2");
  Assert.equal(pass.value, "pass2");
}
