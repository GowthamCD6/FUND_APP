import {StyleSheet} from 'react-native';

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    flex: 1,
    paddingBottom:20,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent:'center',
  },
  hi: {
    marginLeft: 20,
    color: 'black',
    fontSize: 26,
    fontWeight: '700',
  },
  sectoptext: {
    marginLeft: 20,
    color: '#666666',
    fontSize: 15,
    fontWeight: '600',
  },
  logimg: {
    marginTop: 28,
    alignSelf: 'center',
  },
  inputcontainer: {
    marginHorizontal: 20,
    gap: 28,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginLeft: 20,
    marginTop: 10,
  },
  checkboxText: {
    marginLeft: 10,
    fontSize: 12,
    fontWeight: '500',
    color: '#000000',
  },
  btn: {
    width: 211,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2842C4',
    borderRadius: 8,
  },
  btntext: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  pressablebtn: {
    marginTop: 30,
    alignSelf: 'center',
  },
  separator: {
    marginTop: 30,
    alignSelf: 'center',
    height: 16,
    width: 281,
  },
  googletext: {
    marginTop: 20,
    alignSelf: 'center',
    color: '#595959',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'DMSans-Regular',
  },
  googleauthcontainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 20,
    height: 50,
    width: 270,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#92A5B5',
  },
  googleicon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  googleauthtext: {
    color: '#3C4043',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'DMSans-Regular',
  },
});

export default styles;